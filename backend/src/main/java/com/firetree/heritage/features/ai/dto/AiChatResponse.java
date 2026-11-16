package com.firetree.heritage.features.ai.dto;

import java.util.List;

public record AiChatResponse(
    String answer,
    List<AiNavigationSuggestion> suggestions,
    String source
) {
}
