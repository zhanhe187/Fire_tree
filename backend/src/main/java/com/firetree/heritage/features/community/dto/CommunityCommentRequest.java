package com.firetree.heritage.features.community.dto;

import jakarta.validation.constraints.Size;

public record CommunityCommentRequest(
    Long authorId,
    @Size(max = 2000) String content
) {
}
