package com.firetree.heritage.features.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.ai.dto.AiChatMessage;
import com.firetree.heritage.features.ai.dto.AiChatRequest;
import com.firetree.heritage.features.ai.dto.AiChatResponse;
import com.firetree.heritage.features.ai.dto.AiNavigationSuggestion;
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
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AiChatService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiChatService.class);
    private static final String AI_SOURCE = "AI_CHAT_COMPLETIONS";
    private static final String UNAVAILABLE_SOURCE = "AI_UNAVAILABLE_FALLBACK";
    private static final String NAVIGATION_SOURCE = "NAVIGATION_FALLBACK";

    private static final List<PageIndexItem> PAGE_INDEX = List.of(
        new PageIndexItem("门户首页", "/", "portal", "首页 非遗 介绍 入口 视频"),
        new PageIndexItem("非遗项目浏览", "/explore", "portal", "浏览 项目 地区 分类 非遗 名录"),
        new PageIndexItem("知识图谱入口", "/graph", "shared", "图谱 关系 探索 节点"),
        new PageIndexItem("知识图谱看板", "/graph/board", "shared", "图谱 看板 智能检索 链路 关系"),
        new PageIndexItem("社区问答", "/community", "portal", "社区 问答 提问 回答 交流"),
        new PageIndexItem("非遗问答台", "/qa", "portal", "问答 提问 回答 传承人"),
        new PageIndexItem("收藏学习", "/favorites", "portal", "收藏 学习 个人 图谱"),
        new PageIndexItem("tend每日打卡", "/favorites/checkin", "portal", "打卡 推荐 学习 日历"),
        new PageIndexItem("资料提交", "/material-submit", "portal", "提交 资料 图片 素材 补全 上传"),
        new PageIndexItem("个人信息", "/profile", "portal", "个人 信息 资料 账号"),
        new PageIndexItem("后台工作台", "/admin/dashboard", "admin", "后台 工作台 总览 仪表盘"),
        new PageIndexItem("后台图谱看板", "/admin/graph/board", "admin", "后台 图谱 看板 关系 链路"),
        new PageIndexItem("节点管理", "/admin/graph/nodes", "admin", "节点 管理 实体 新增 编辑 审核"),
        new PageIndexItem("关系管理", "/admin/graph/edges", "admin", "关系 边 管理 建模 师承"),
        new PageIndexItem("申报审核", "/admin/review/applications", "admin", "申报 审核 材料 流程"),
        new PageIndexItem("风险报告", "/admin/review/risk", "admin", "风险 报告 扫描 断点"),
        new PageIndexItem("多媒体档案", "/admin/content/media", "admin", "媒体 图片 视频 音频 档案"),
        new PageIndexItem("问答治理", "/admin/content/community", "admin", "社区 问答 治理 评论"),
        new PageIndexItem("文创评价", "/admin/content/products", "admin", "文创 产品 评价 审核"),
        new PageIndexItem("收藏运营", "/admin/operations/favorites", "admin", "收藏 运营 私人 图谱"),
        new PageIndexItem("推荐打卡运营", "/admin/operations/learning", "admin", "推荐 打卡 学习 运营"),
        new PageIndexItem("数据地图", "/admin/analytics/map", "admin", "地图 数据 大屏 分析")
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final int timeoutSeconds;

    @Autowired
    public AiChatService(
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

    AiChatService(
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

    public AiChatResponse chat(AiChatRequest request) {
        String message = request == null || request.message() == null ? "" : request.message().trim();
        if (message.isBlank()) {
            return new AiChatResponse("请输入你想了解的非遗问题，或告诉我你想找哪个功能。", List.of(), NAVIGATION_SOURCE);
        }
        if (!configured()) {
            return fallback(message, request, UNAVAILABLE_SOURCE);
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(chatCompletionsUri())
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody(request, message)))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.warn("AI chat returned HTTP {}: {}", response.statusCode(), response.body());
                return fallback(message, request, UNAVAILABLE_SOURCE);
            }
            return parseResponse(response.body(), message, request);
        } catch (Exception exception) {
            LOGGER.warn("AI chat request failed, falling back to navigation suggestions: {}", exception.getMessage());
            return fallback(message, request, UNAVAILABLE_SOURCE);
        }
    }

    private AiChatResponse parseResponse(String responseBody, String message, AiChatRequest request) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
            return fallback(message, request, UNAVAILABLE_SOURCE);
        }

        JsonNode content = objectMapper.readTree(stripJsonFence(contentNode.asText()));
        String answer = safeText(content.path("answer"), "");
        List<AiNavigationSuggestion> suggestions = parseSuggestions(content.path("suggestions"), request);
        if (answer.isBlank()) {
            return fallback(message, request, NAVIGATION_SOURCE);
        }
        return new AiChatResponse(answer, suggestions, AI_SOURCE);
    }

    private String requestBody(AiChatRequest request, String message) throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("temperature", 0.2);
        payload.put("response_format", Map.of("type", "json_object"));
        payload.put("messages", List.of(
            Map.of(
                "role", "system",
                "content", """
                    You are an assistant for an intangible cultural heritage knowledge graph project.
                    Answer in Chinese. You can explain heritage concepts and help users find project pages.
                    Use only the provided pageIndex for route suggestions. Do not invent routes.
                    Return JSON only with keys: answer, suggestions.
                    suggestions is an array of objects with title, route, audience, reason.
                    """
            ),
            Map.of(
                "role", "user",
                "content", objectMapper.writeValueAsString(Map.of(
                    "message", message,
                    "history", safeHistory(request),
                    "audience", safeAudience(request),
                    "currentRoute", request == null ? "" : blankToEmpty(request.currentRoute()),
                    "roleCodes", request == null || request.roleCodes() == null ? List.of() : request.roleCodes(),
                    "pageIndex", visiblePageIndex(request)
                ))
            )
        ));
        return objectMapper.writeValueAsString(payload);
    }

    private List<AiChatMessage> safeHistory(AiChatRequest request) {
        if (request == null || request.history() == null || request.history().isEmpty()) {
            return List.of();
        }
        int from = Math.max(0, request.history().size() - 8);
        return request.history().subList(from, request.history().size()).stream()
            .filter(item -> item != null && item.content() != null && !item.content().isBlank())
            .map(item -> new AiChatMessage(safeRole(item.role()), item.content().trim()))
            .toList();
    }

    private List<Map<String, String>> visiblePageIndex(AiChatRequest request) {
        return PAGE_INDEX.stream()
            .filter(item -> canSuggest(item, request))
            .map(item -> Map.of(
                "title", item.title(),
                "route", item.route(),
                "audience", item.audience(),
                "keywords", item.keywords()
            ))
            .toList();
    }

    private AiChatResponse fallback(String message, AiChatRequest request, String source) {
        List<AiNavigationSuggestion> suggestions = fallbackSuggestions(message, request);
        String answer = source.equals(UNAVAILABLE_SOURCE)
            ? "AI 服务暂不可用，我先根据项目功能索引帮你定位页面。"
            : "我先根据项目功能索引帮你定位页面。";
        if (suggestions.isEmpty()) {
            answer += " 你可以尝试说明想浏览非遗内容、查看图谱、提交资料、社区提问或进入后台管理。";
        }
        return new AiChatResponse(answer, suggestions, source);
    }

    private List<AiNavigationSuggestion> fallbackSuggestions(String message, AiChatRequest request) {
        String normalized = message.toLowerCase(Locale.ROOT);
        List<AiNavigationSuggestion> matches = new ArrayList<>();
        for (PageIndexItem item : PAGE_INDEX) {
            if (!canSuggest(item, request)) {
                continue;
            }
            String searchable = (item.title() + " " + item.route() + " " + item.keywords()).toLowerCase(Locale.ROOT);
            if (matchesAny(normalized, searchable)) {
                matches.add(new AiNavigationSuggestion(item.title(), item.route(), item.audience(), "根据你的问题匹配到该功能入口"));
            }
            if (matches.size() >= 4) {
                return matches;
            }
        }
        return matches;
    }

    private boolean matchesAny(String message, String searchable) {
        if (message.isBlank()) {
            return false;
        }
        Set<String> keywords = Set.of(
            "提交", "资料", "素材", "上传", "图谱", "节点", "关系", "链路", "检索",
            "问答", "社区", "收藏", "打卡", "审核", "申报", "风险", "媒体", "文创", "地图",
            "个人", "浏览", "首页", "后台", "管理"
        );
        return keywords.stream().anyMatch(keyword -> message.contains(keyword) && searchable.contains(keyword));
    }

    private List<AiNavigationSuggestion> parseSuggestions(JsonNode node, AiChatRequest request) {
        if (!node.isArray()) {
            return List.of();
        }
        List<AiNavigationSuggestion> suggestions = new ArrayList<>();
        node.forEach(item -> {
            String route = safeText(item.path("route"), "");
            PageIndexItem page = PAGE_INDEX.stream()
                .filter(indexItem -> indexItem.route().equals(route) && canSuggest(indexItem, request))
                .findFirst()
                .orElse(null);
            if (page != null) {
                suggestions.add(new AiNavigationSuggestion(
                    safeText(item.path("title"), page.title()),
                    page.route(),
                    page.audience(),
                    safeText(item.path("reason"), "可从这里继续操作")
                ));
            }
        });
        return suggestions.stream().limit(4).toList();
    }

    private boolean canSuggest(PageIndexItem item, AiChatRequest request) {
        String audience = safeAudience(request);
        if ("portal".equals(audience)) {
            return !"admin".equals(item.audience());
        }
        if ("admin".equals(item.audience()) && !canAccessAdmin(request)) {
            return false;
        }
        return "admin".equals(audience) || !"admin".equals(item.audience());
    }

    private boolean canAccessAdmin(AiChatRequest request) {
        if (request == null || request.roleCodes() == null) {
            return true;
        }
        return request.roleCodes().stream().anyMatch(role -> "SUPER_ADMIN".equals(role) || "INHERITOR".equals(role));
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

    private String safeText(JsonNode node, String fallback) {
        return node.isMissingNode() || node.asText().isBlank() ? fallback : node.asText().trim();
    }

    private String safeAudience(AiChatRequest request) {
        String audience = request == null ? "" : blankToEmpty(request.audience()).toLowerCase(Locale.ROOT);
        return "admin".equals(audience) ? "admin" : "portal";
    }

    private String safeRole(String role) {
        String normalized = blankToEmpty(role).toLowerCase(Locale.ROOT);
        return List.of("user", "assistant", "system").contains(normalized) ? normalized : "user";
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private record PageIndexItem(String title, String route, String audience, String keywords) {
    }
}
