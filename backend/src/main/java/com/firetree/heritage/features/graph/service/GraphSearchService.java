package com.firetree.heritage.features.graph.service;

import com.firetree.heritage.features.graph.dto.GraphAiSearchRequest;
import com.firetree.heritage.features.graph.dto.GraphPathSearchRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.firetree.heritage.features.graph.mapper.GraphSearchMapper;
import org.springframework.stereotype.Service;

@Service
public class GraphSearchService {

    private final GraphSearchMapper mapper;

    public GraphSearchService(GraphSearchMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> unifiedSearch(String keyword, List<String> typeCodes, boolean includeRelations, int page, int size) {
        return mapper.unifiedSearch(keyword, typeCodes, includeRelations, page, size);
    }

    public Map<String, Object> relations(long nodeId, int depth, String direction, List<String> relationTypes, int limit) {
        return mapper.relations(nodeId, depth, direction, relationTypes, limit);
    }

    public Map<String, Object> pathSearch(GraphPathSearchRequest request) {
        return mapper.pathSearch(request);
    }

    public Map<String, Object> aiSearch(GraphAiSearchRequest request) {
        return mapper.aiSearch(request);
    }
}
