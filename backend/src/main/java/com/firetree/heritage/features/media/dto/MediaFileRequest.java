package com.firetree.heritage.features.media.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record MediaFileRequest(
    @Size(max = 64) String bucketName,
    @Size(max = 512) String objectKey,
    @Size(max = 255) String originalName,
    String fileType,
    @Size(max = 128) String contentType,
    @Min(0) Long fileSize,
    @Size(max = 128) String checksum,
    @Size(max = 512) String previewUrl,
    String visibility,
    String auditStatus
) {
}
