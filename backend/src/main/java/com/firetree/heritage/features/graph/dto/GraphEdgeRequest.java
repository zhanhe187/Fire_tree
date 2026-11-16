package com.firetree.heritage.features.graph.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record GraphEdgeRequest(
    Long sourceNodeId,
    Long targetNodeId,
    Long edgeTypeId,
    Boolean directed,
    @DecimalMin("0.0001") @DecimalMax("9999.9999") BigDecimal weight,
    @Size(max = 128) String relationLabel,
    Integer startYear,
    Integer endYear,
    String auditStatus
) {
}

