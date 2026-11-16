package com.firetree.heritage.features.media.dto;

import jakarta.validation.constraints.Size;

public record MediaLinkRequest(
    Long nodeId,
    @Size(max = 255) String caption,
    Integer sortOrder
) {
}
