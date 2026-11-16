package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
    @Size(max = 64) String nickname,
    @Size(max = 64) String realName,
    @Size(max = 32) String phone,
    @Size(max = 128) String email,
    @Size(max = 512) String avatarUrl
) {
}
