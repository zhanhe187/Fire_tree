package com.firetree.heritage.features.graph.controller;

import com.firetree.heritage.features.graph.dto.GraphNodeRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.graph.service.GraphNodeService;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/graph")
public class GraphNodeController {

    private final GraphNodeService graphNodeService;
    private final AccessControlService accessControlService;

    public GraphNodeController(GraphNodeService graphNodeService, AccessControlService accessControlService) {
        this.graphNodeService = graphNodeService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/node-types")
    public Map<String, Object> nodeTypes() {
        return graphNodeService.nodeTypes();
    }

    @GetMapping("/nodes")
    public Map<String, Object> nodes(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long nodeTypeId,
        @RequestParam(required = false) String auditStatus,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return graphNodeService.searchNodes(keyword, nodeTypeId, auditStatus, page, size);
    }

    @GetMapping("/nodes/{id}")
    public Map<String, Object> node(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @RequestParam(defaultValue = "false") boolean includeAllMedia
    ) {
        if (includeAllMedia) {
            accessControlService.requireSuperAdmin(authorization);
        }
        return graphNodeService.getNode(id, includeAllMedia);
    }

    @GetMapping("/nodes/{id}/media")
    public Map<String, Object> nodeMediaFiles(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @RequestParam(defaultValue = "false") boolean includeAllMedia
    ) {
        if (includeAllMedia) {
            accessControlService.requireSuperAdmin(authorization);
        }
        List<Map<String, Object>> items = graphNodeService.getNodeMediaFiles(id, includeAllMedia);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", items.size());
        result.put("items", items);
        return result;
    }

    @PostMapping("/nodes")
    public Map<String, Object> createNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody GraphNodeRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return graphNodeService.createNode(request, context.userId(), true);
    }

    @PutMapping("/nodes/{id}")
    public Map<String, Object> updateNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody GraphNodeRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return graphNodeService.updateNode(id, request, context.userId(), true);
    }

    @DeleteMapping("/nodes/{id}")
    public void deleteNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        graphNodeService.deleteNode(id, context.userId(), true);
    }
}
