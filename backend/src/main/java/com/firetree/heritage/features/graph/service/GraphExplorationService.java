package com.firetree.heritage.features.graph.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import com.firetree.heritage.features.graph.mapper.GraphExplorationMapper;
import org.springframework.stereotype.Service;

@Service
public class GraphExplorationService {

    private final GraphExplorationMapper mapper;

    public GraphExplorationService(GraphExplorationMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> visualization(String keyword, Long nodeTypeId, Long edgeTypeId, int page, int size) {
        return mapper.visualization(keyword, nodeTypeId, edgeTypeId, page, size);
    }

    /** 关系最多的节点：看板默认以它为中心，打开就有关系图。 */
    public Map<String, Object> hubs(int limit) {
        return mapper.hubs(limit);
    }

    public Map<String, Object> semanticSearch(String question) {
        return mapper.semanticSearch(question);
    }
}
