package com.firetree.heritage.features.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
    @Size(max = 96) String productCode,
    @Size(max = 128) String name,
    @Size(max = 4000) String description,
    Long coverFileId,
    Long relatedNodeId,
    Long ownerUserId,
    @Size(max = 64) String ownerUsername,
    @Size(max = 512) String externalUrl,
    @DecimalMin("0.00") BigDecimal price,
    @Min(0) Integer stock,
    String status
) {
}
