package com.firetree.heritage.features.learning.service;

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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiRecommendationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiRecommendationService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final int timeoutSeconds;

    @Autowired
    public AiRecommendationService(
        ObjectMapper objectMapper,
        @Value("${heritage.ai.api-key:}") String apiKey,
        @Value("${heritage.ai.base-url:}") String baseUrl,
        @Value("${heritage.ai.model:}") String model,
        @Value("${heritage.ai.timeout-seconds:10}") int timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(Math.max(1, timeoutSeconds))).build();
        this.apiKey = blankToEmpty(apiKey);
        this.baseUrl = blankToEmpty(baseUrl);
        this.model = blankToEmpty(model);
        this.timeoutSeconds = Math.max(1, timeoutSeconds);
    }

    public List<RecommendationChoice> createChoices(LocalDate date, List<Map<String, Object>> candidates, int limit) {
        if (!configured() || candidates.isEmpty()) {
            return List.of();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(chatCompletionsUri())
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody(date, candidates, limit)))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.warn("AI recommendation returned HTTP {}: {}", response.statusCode(), response.body());
                return List.of();
            }
            return parseChoices(response.body(), limit);
        } catch (Exception exception) {
            LOGGER.warn("AI recommendation failed, falling back to rule-based ranking: {}", exception.getMessage());
            return List.of();
        }
    }

    private String requestBody(LocalDate date, List<Map<String, Object>> candidates, int limit) throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.3);
        payload.put("response_format", Map.of("type", "json_object"));
        payload.put("messages", List.of(
            Map.of(
                "role", "system",
                "content", """
                    You create daily learning recommendations for an intangible cultural heritage knowledge graph.
                    Return JSON only: {"items":[{"nodeId":123,"reason":"Chinese reason under 36 chars"}]}.
                    Pick diverse public heritage nodes. Reasons must be concise Chinese learning motivations.
                    """
            ),
            Map.of(
                "role", "user",
                "content", objectMapper.writeValueAsString(Map.of(
                    "date", date.toString(),
                    "limit", limit,
                    "candidates", candidates
                ))
            )
        ));
        return objectMapper.writeValueAsString(payload);
    }

    private List<RecommendationChoice> parseChoices(String responseBody, int limit) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
            return List.of();
        }
        JsonNode items = objectMapper.readTree(stripJsonFence(contentNode.asText())).path("items");
        if (!items.isArray()) {
            return List.of();
        }
        List<RecommendationChoice> choices = new ArrayList<>();
        for (JsonNode item : items) {
            long nodeId = item.path("nodeId").asLong(0);
            String reason = item.path("reason").asText("").trim();
            if (nodeId > 0 && !reason.isBlank()) {
                choices.add(new RecommendationChoice(nodeId, reason));
            }
            if (choices.size() >= limit) {
                break;
            }
        }
        return choices;
    }

    private URI chatCompletionsUri() {
        String normalized = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (normalized.endsWith("/chat/completions")) {
            return URI.create(normalized);
        }
        return URI.create(normalized + "/chat/completions");
    }

    private boolean configured() {
        return !apiKey.isBlank() && !baseUrl.isBlank() && !model.isBlank();
    }

    private String stripJsonFence(String content) {
        String trimmed = content.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        String withoutOpening = trimmed.replaceFirst("^```(?:json)?\\s*", "");
        return withoutOpening.replaceFirst("\\s*```$", "").trim();
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    public record RecommendationChoice(long nodeId, String reason) {
    }
}
