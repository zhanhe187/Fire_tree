package com.firetree.heritage.features.graph.controller;

import com.firetree.heritage.features.graph.dto.GraphAiSearchRequest;
import com.firetree.heritage.features.graph.dto.GraphPathSearchRequest;
import com.firetree.heritage.features.system.service.AuditLogService;
import com.firetree.heritage.features.system.service.ProjectMetricsService;
import com.firetree.heritage.features.graph.service.GraphExplorationService;
import com.firetree.heritage.features.graph.service.GraphSearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final ProjectMetricsService metricsService;
    private final GraphExplorationService graphExplorationService;
    private final GraphSearchService graphSearchService;
    private final AuditLogService auditLogService;

    public GraphController(
        ProjectMetricsService metricsService,
        GraphExplorationService graphExplorationService,
        GraphSearchService graphSearchService,
        AuditLogService auditLogService
    ) {
        this.metricsService = metricsService;
        this.graphExplorationService = graphExplorationService;
        this.graphSearchService = graphSearchService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return metricsService.graphOverview();
    }

    @GetMapping("/visualization")
    public Map<String, Object> visualization(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long nodeTypeId,
        @RequestParam(required = false) Long edgeTypeId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "15") int size
    ) {
        return graphExplorationService.visualization(keyword, nodeTypeId, edgeTypeId, page, size);
    }

    /** 关系数最多的节点（枢纽）：看板打开时默认以它为中心展开，避免首屏全是孤立节点。 */
    @GetMapping("/hubs")
    public Map<String, Object> hubs(@RequestParam(defaultValue = "5") int limit) {
        return graphExplorationService.hubs(limit);
    }

    @GetMapping("/search/semantic")
    public Map<String, Object> semanticSearch(@RequestParam String question) {
        Map<String, Object> result = graphExplorationService.semanticSearch(question);
        int resultCount = ((Number) result.getOrDefault("total", 0)).intValue();
        auditLogService.recordSearch(null, question, "SEMANTIC", resultCount);
        return result;
    }

    @GetMapping("/search")
    public Map<String, Object> unifiedSearch(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) List<String> typeCodes,
        @RequestParam(defaultValue = "true") boolean includeRelations,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Map<String, Object> result = graphSearchService.unifiedSearch(keyword, typeCodes, includeRelations, page, size);
        int resultCount = ((Number) result.getOrDefault("total", 0)).intValue();
        auditLogService.recordSearch(null, keyword, "KEYWORD", resultCount);
        return result;
    }

    @GetMapping("/nodes/{id}/relations")
    public Map<String, Object> nodeRelations(
        @PathVariable long id,
        @RequestParam(defaultValue = "1") int depth,
        @RequestParam(defaultValue = "both") String direction,
        @RequestParam(required = false) List<String> relationTypes,
        @RequestParam(defaultValue = "80") int limit
    ) {
        return graphSearchService.relations(id, depth, direction, relationTypes, limit);
    }

    @PostMapping("/search/path")
    public Map<String, Object> pathSearch(@RequestBody GraphPathSearchRequest request) {
        Map<String, Object> result = graphSearchService.pathSearch(request);
        auditLogService.recordSearch(null, "path:" + request.startNodeId(), "SEMANTIC", ((List<?>) result.getOrDefault("chains", List.of())).size());
        return result;
    }

    @PostMapping("/search/ai")
    public Map<String, Object> aiSearch(@RequestBody GraphAiSearchRequest request) {
        Map<String, Object> result = graphSearchService.aiSearch(request);
        auditLogService.recordSearch(null, request.question(), "SEMANTIC", ((List<?>) result.getOrDefault("results", List.of())).size());
        return result;
    }
}
