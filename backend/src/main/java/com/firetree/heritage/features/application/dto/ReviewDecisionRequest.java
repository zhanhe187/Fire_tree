package com.firetree.heritage.features.application.dto;

import jakarta.validation.constraints.Size;

public record ReviewDecisionRequest(
    Long reviewerId,
    @Size(max = 1000) String reviewComment
) {
}
