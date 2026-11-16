package com.firetree.heritage.features.governance.dto;

import jakarta.validation.constraints.Size;

public record RiskResolveRequest(
    String decision,
    @Size(max = 1000) String comment
) {
}
