package com.firetree.heritage.features.exhibition.dto;

import jakarta.validation.constraints.Size;

public record ExhibitionNodeRequest(
    Long nodeId,
    @Size(max = 64) String boothNo
) {
}
