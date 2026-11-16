package com.firetree.heritage.features.governance.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SensitiveWordRequest(
    @NotBlank(message = "Sensitive word is required")
    @Size(max = 120, message = "Sensitive word must be at most 120 characters")
    String word,

    @Size(max = 40, message = "Word type must be at most 40 characters")
    String wordType,

    @Min(value = 1, message = "Severity must be between 1 and 3")
    @Max(value = 3, message = "Severity must be between 1 and 3")
    Integer severity,

    @Min(value = 0, message = "Status must be 0 or 1")
    @Max(value = 1, message = "Status must be 0 or 1")
    Integer status
) {
}
