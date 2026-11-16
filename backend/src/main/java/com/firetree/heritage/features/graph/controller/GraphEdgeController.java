package com.firetree.heritage.features.graph.controller;

import com.firetree.heritage.features.graph.dto.GraphEdgeRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.graph.service.GraphEdgeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/graph")
public class GraphEdgeController {

    private final GraphEdgeService graphEdgeService;
    private final AccessControlService accessControlService;

    public GraphEdgeController(GraphEdgeService graphEdgeService, AccessControlService accessControlService) {
        this.graphEdgeService = graphEdgeService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/edge-types")
    public Map<String, Object> edgeTypes() {
        return graphEdgeService.edgeTypes();
    }

    @GetMapping("/edges")
    public Map<String, Object> edges(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long edgeTypeId,
        @RequestParam(required = false) String auditStatus,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return graphEdgeService.searchEdges(keyword, edgeTypeId, auditStatus, page, size);
    }

    @GetMapping("/edges/{id}")
    public Map<String, Object> edge(@PathVariable long id) {
        return graphEdgeService.getEdge(id);
    }

    @PostMapping("/edges")
    public Map<String, Object> createEdge(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody GraphEdgeRequest request
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return graphEdgeService.createEdge(request);
    }

    @PutMapping("/edges/{id}")
    public Map<String, Object> updateEdge(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody GraphEdgeRequest request
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return graphEdgeService.updateEdge(id, request);
    }

    @DeleteMapping("/edges/{id}")
    public void deleteEdge(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        accessControlService.requireSuperAdmin(authorization);
        graphEdgeService.deleteEdge(id);
    }
}
