package com.firetree.heritage.features.product.dto;

import jakarta.validation.constraints.NotNull;

public record ProductLinkRequest(
    @NotNull Long productId
) {
}
