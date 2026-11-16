package com.firetree.heritage.features.ai.dto;

import java.util.List;

public record AiChatRequest(
    String message,
    List<AiChatMessage> history,
    String audience,
    String currentRoute,
    List<String> roleCodes
) {
}
