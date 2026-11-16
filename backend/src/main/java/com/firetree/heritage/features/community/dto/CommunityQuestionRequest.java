package com.firetree.heritage.features.community.dto;

import jakarta.validation.constraints.Size;

public record CommunityQuestionRequest(
    Long nodeId,
    Long authorId,
    @Size(max = 255) String title,
    @Size(max = 5000) String content,
    String imageUrl
) {
}
