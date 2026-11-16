package com.firetree.heritage.features.admin.dto;

import jakarta.validation.constraints.Size;

public record AdminUserUpdateRequest(
    @Size(max = 64) String nickname,
    @Size(max = 64) String realName,
    @Size(max = 32) String phone,
    @Size(max = 128) String email,
    String userType,
    Integer status
) {
}
