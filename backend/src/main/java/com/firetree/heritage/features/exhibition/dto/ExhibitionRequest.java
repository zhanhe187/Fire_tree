package com.firetree.heritage.features.exhibition.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExhibitionRequest(
    @Size(max = 255) String title,
    String description,
    Long coverFileId,
    @Size(max = 64) String province,
    @Size(max = 64) String city,
    @Size(max = 255) String address,
    BigDecimal longitude,
    BigDecimal latitude,
    LocalDateTime startTime,
    LocalDateTime endTime,
    @Size(max = 128) String organizer,
    String status
) {
}
