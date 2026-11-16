package com.firetree.heritage.features.learning.dto;

public record LearningCheckinRequest(
    Long userId,
    String username,
    String date
) {
}
