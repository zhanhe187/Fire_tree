package com.firetree.heritage.features.ai.service;

import java.util.List;

public record AiSearchPlan(
    String intent,
    List<String> targetTypes,
    List<List<String>> relationPaths,
    List<List<AiSearchStep>> stepPaths,
    List<String> startEntityNames,
    String answerLabel,
    String parser
) {
    public record AiSearchStep(String relationType, String direction) {
    }
}
