package com.firetree.heritage.features.graph.dto;

import java.util.List;

public record GraphPathSearchRequest(
    Long startNodeId,
    List<List<String>> paths,
    Integer limit
) {
}
