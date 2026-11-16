package com.firetree.heritage.features.graph.service;

import com.firetree.heritage.features.graph.dto.GraphNodeRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Year;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.graph.mapper.GraphNodeMapper;
import org.springframework.stereotype.Service;

@Service
public class GraphNodeService {

    private final GraphNodeMapper mapper;

    public GraphNodeService(GraphNodeMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> nodeTypes() {
        return mapper.nodeTypes();
    }

    public Map<String, Object> searchNodes(String keyword, Long nodeTypeId, String auditStatus, int page, int size) {
        return mapper.searchNodes(keyword, nodeTypeId, auditStatus, page, size);
    }

    public Map<String, Object> getNode(long id) {
        return mapper.getNode(id, false);
    }

    public Map<String, Object> getNode(long id, boolean includeAllMedia) {
        return mapper.getNode(id, includeAllMedia);
    }

    public List<Map<String, Object>> getNodeMediaFiles(long id, boolean includeAllMedia) {
        return mapper.getNodeMediaFiles(id, includeAllMedia);
    }

    public Map<String, Object> createNode(GraphNodeRequest request, long operatorId, boolean superAdmin) {
        return mapper.createNode(request, operatorId, superAdmin);
    }

    public Map<String, Object> updateNode(long id, GraphNodeRequest request, long operatorId, boolean superAdmin) {
        return mapper.updateNode(id, request, operatorId, superAdmin);
    }

    public void deleteNode(long id, long operatorId, boolean superAdmin) {
        mapper.deleteNode(id, operatorId, superAdmin);
    }
}
