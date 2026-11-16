package com.firetree.heritage.features.community.dto;

import jakarta.validation.constraints.Size;

public record CommunityAnswerRequest(
    Long authorId,
    @Size(max = 5000) String content
) {
}
