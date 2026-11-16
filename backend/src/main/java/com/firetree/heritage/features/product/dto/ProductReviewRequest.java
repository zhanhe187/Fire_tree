package com.firetree.heritage.features.product.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ProductReviewRequest(
    @Min(1) @Max(5) Integer rating,
    @Size(max = 1000) String content
) {
}
