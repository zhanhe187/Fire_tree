package com.firetree.heritage.features.admin.dto;

import jakarta.validation.constraints.Size;

public record AdminUserPasswordRequest(
    @Size(min = 6, max = 64) String newPassword
) {
}
