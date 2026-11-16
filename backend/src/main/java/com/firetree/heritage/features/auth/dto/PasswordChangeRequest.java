package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
    @NotBlank(message = "oldPassword is required") String oldPassword,
    @NotBlank(message = "newPassword is required") @Size(max = 128) String newPassword
) {
}
