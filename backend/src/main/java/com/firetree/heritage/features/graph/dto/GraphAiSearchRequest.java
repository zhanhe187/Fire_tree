package com.firetree.heritage.features.graph.dto;

public record GraphAiSearchRequest(
    String question,
    String mode,
    Integer topK,
    Long currentNodeId
) {
}
