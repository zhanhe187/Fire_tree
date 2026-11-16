package com.firetree.heritage.features.graph.service;

import com.firetree.heritage.features.graph.dto.GraphEdgeRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.firetree.heritage.features.graph.mapper.GraphEdgeMapper;
import org.springframework.stereotype.Service;

@Service
public class GraphEdgeService {

    private final GraphEdgeMapper mapper;

    public GraphEdgeService(GraphEdgeMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> edgeTypes() {
        return mapper.edgeTypes();
    }

    public Map<String, Object> searchEdges(String keyword, Long edgeTypeId, String auditStatus, int page, int size) {
        return mapper.searchEdges(keyword, edgeTypeId, auditStatus, page, size);
    }

    public Map<String, Object> getEdge(long id) {
        return mapper.getEdge(id);
    }

    public Map<String, Object> createEdge(GraphEdgeRequest request) {
        return mapper.createEdge(request);
    }

    public Map<String, Object> updateEdge(long id, GraphEdgeRequest request) {
        return mapper.updateEdge(id, request);
    }

    public void deleteEdge(long id) {
        mapper.deleteEdge(id);
    }
}
