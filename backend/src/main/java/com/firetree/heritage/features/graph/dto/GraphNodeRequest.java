package com.firetree.heritage.features.graph.dto;

import jakarta.validation.constraints.Size;

public record GraphNodeRequest(
    @Size(max = 96) String nodeCode,
    Long nodeTypeId,
    @Size(max = 128) String name,
    @Size(max = 255) String alias,
    @Size(max = 64) String category,
    @Size(max = 1000) String summary,
    String content,
    @Size(max = 64) String province,
    @Size(max = 64) String city,
    @Size(max = 64) String district,
    @Size(max = 255) String address,
    @Size(max = 128) String historicalPeriod,
    @Size(max = 64) String projectLevel,
    Integer birthYear,
    @Size(max = 255) String sourceName,
    @Size(max = 512) String sourceUrl,
    @Size(max = 512) String coverImageUrl,
    @Size(max = 255) String coverImageCaption,
    String visibility,
    String auditStatus
) {
}
