package com.firetree.heritage.features.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record ApplicationRequest(
    @Size(max = 64) String applicationNo,
    Long applicantUserId,
    @Size(max = 64) String applicantUsername,
    Long targetNodeId,
    String applicationType,
    @Size(max = 255) String title,
    Map<String, Object> formData,
    @Min(0) Integer currentStep
) {
}
