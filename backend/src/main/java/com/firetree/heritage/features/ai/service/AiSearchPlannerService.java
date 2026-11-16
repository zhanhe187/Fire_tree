package com.firetree.heritage.features.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiSearchPlannerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiSearchPlannerService.class);
    private static final String PARSER_NAME = "AI_CHAT_COMPLETIONS";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final int timeoutSeconds;

    @Autowired
    public AiSearchPlannerService(
        ObjectMapper objectMapper,
        @Value("${heritage.ai.api-key:}") String apiKey,
        @Value("${heritage.ai.base-url:}") String baseUrl,
        @Value("${heritage.ai.model:}") String model,
        @Value("${heritage.ai.timeout-seconds:10}") int timeoutSeconds
    ) {
        this(
            objectMapper,
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(Math.max(1, timeoutSeconds))).build(),
            apiKey,
            baseUrl,
            model,
            timeoutSeconds
        );
    }

    private AiSearchPlannerService(
        ObjectMapper objectMapper,
        HttpClient httpClient,
        String apiKey,
        String baseUrl,
        String model,
        int timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.apiKey = blankToEmpty(apiKey);
        this.baseUrl = blankToEmpty(baseUrl);
        this.model = blankToEmpty(model);
        this.timeoutSeconds = Math.max(1, timeoutSeconds);
    }

    public Optional<AiSearchPlan> createPlan(String question, List<Map<String, Object>> candidates, String mode) {
        if (!configured()) {
            return Optional.empty();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(chatCompletionsUri())
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody(question, candidates, mode)))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.warn("AI planner returned HTTP {}: {}", response.statusCode(), response.body());
                return Optional.empty();
            }
            return parseResponse(response.body());
        } catch (Exception exception) {
            LOGGER.warn("AI planner request failed, falling back to rule-based search: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    private Optional<AiSearchPlan> parseResponse(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
            return Optional.empty();
        }

        JsonNode content = objectMapper.readTree(stripJsonFence(contentNode.asText()));
        String intent = safeText(content.path("intent"), "RELATION_EXPLORATION");
        List<String> targetTypes = stringList(content.path("targetTypes"));
        List<List<String>> relationPaths = pathList(content.path("relationPaths"));
        List<List<AiSearchPlan.AiSearchStep>> stepPaths = stepPathList(content.path("stepPaths"));
        List<String> startEntityNames = stringList(content.path("startEntityNames"));
        String answerLabel = safeText(content.path("answerLabel"), "");
        if (targetTypes.isEmpty() && relationPaths.isEmpty() && stepPaths.isEmpty() && startEntityNames.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new AiSearchPlan(intent, targetTypes, relationPaths, stepPaths, startEntityNames, answerLabel, PARSER_NAME));
    }

    private String requestBody(String question, List<Map<String, Object>> candidates, String mode) throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.1);
        payload.put("response_format", Map.of("type", "json_object"));
        payload.put("messages", List.of(
            Map.of(
                "role", "system",
                "content", """
                    You convert cultural heritage graph search questions into JSON plans.
                    Return JSON only with keys: intent, targetTypes, relationPaths, stepPaths, startEntityNames, answerLabel.
                    startEntityNames must list heritage project or graph entity names mentioned in the question, without relation words.
                    Prefer stepPaths for smart retrieval. stepPaths is an array of paths; each path is an array of objects: {"relationType":"has_inheritor","direction":"out"}.
                    direction must be "out" when following source to target, or "in" when reverse searching target to source.
                    Allowed targetTypes: inheritor, craft_technique, craft_process, craft_material, craft_tool, representative_work, region.
                    Allowed relation path steps: has_inheritor, inherited_from, uses_technique, masters_technique, has_process, uses_material, uses_tool, created_work, representative_work_of, originated_in, practiced_in.
                    relationPaths must be an array of arrays, each path length 1 to 3.
                    Examples:
                    - project inheritor master: stepPaths [[has_inheritor out, inherited_from out]], answerLabel master.
                    - master's students: stepPaths [[inherited_from in]], answerLabel students.
                    - who masters technique: stepPaths [[masters_technique in]], answerLabel masters.
                    - projects in region: stepPaths [[originated_in in], [practiced_in in]], answerLabel projects.
                    """
            ),
            Map.of(
                "role", "user",
                "content", objectMapper.writeValueAsString(Map.of(
                    "question", question,
                    "mode", mode == null || mode.isBlank() ? "RELATION_EXPLORATION" : mode,
                    "candidateNodes", candidates
                ))
            )
        ));
        return objectMapper.writeValueAsString(payload);
    }

    private URI chatCompletionsUri() {
        String normalized = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (normalized.endsWith("/chat/completions")) {
            return URI.create(normalized);
        }
        return URI.create(normalized + "/chat/completions");
    }

    private String stripJsonFence(String content) {
        String trimmed = content.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        String withoutOpening = trimmed.replaceFirst("^```(?:json)?\\s*", "");
        return withoutOpening.replaceFirst("\\s*```$", "").trim();
    }

    private boolean configured() {
        return !apiKey.isBlank() && !baseUrl.isBlank() && !model.isBlank();
    }

    private String safeText(JsonNode node, String fallback) {
        return node.isMissingNode() || node.asText().isBlank() ? fallback : node.asText().trim();
    }

    private List<String> stringList(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> {
            String value = item.asText("").trim();
            if (!value.isBlank() && !values.contains(value)) {
                values.add(value);
            }
        });
        return values;
    }

    private List<List<String>> pathList(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<List<String>> paths = new ArrayList<>();
        node.forEach(pathNode -> {
            List<String> path = stringList(pathNode);
            if (!path.isEmpty()) {
                paths.add(path);
            }
        });
        return paths;
    }

    private List<List<AiSearchPlan.AiSearchStep>> stepPathList(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<List<AiSearchPlan.AiSearchStep>> paths = new ArrayList<>();
        node.forEach(pathNode -> {
            if (!pathNode.isArray()) return;
            List<AiSearchPlan.AiSearchStep> path = new ArrayList<>();
            pathNode.forEach(stepNode -> {
                String relationType = safeText(stepNode.path("relationType"), "");
                String direction = safeText(stepNode.path("direction"), "out");
                if (!relationType.isBlank()) {
                    path.add(new AiSearchPlan.AiSearchStep(relationType, "in".equals(direction) ? "in" : "out"));
                }
            });
            if (!path.isEmpty()) {
                paths.add(path);
            }
        });
        return paths;
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
