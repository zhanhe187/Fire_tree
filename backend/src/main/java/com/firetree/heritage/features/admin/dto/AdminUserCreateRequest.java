package com.firetree.heritage.features.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserCreateRequest(
    @NotBlank @Size(max = 64) String username,
    @NotBlank @Size(min = 6, max = 64) String password,
    @Size(max = 64) String nickname,
    String userType,
    @Size(max = 32) String phone,
    @Size(max = 128) String email
) {
}
