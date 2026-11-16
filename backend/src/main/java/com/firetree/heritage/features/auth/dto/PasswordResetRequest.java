package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
    @NotBlank(message = "email is required") @Email @Size(max = 128) String email,
    @NotBlank(message = "emailCode is required") @Size(max = 12) String emailCode,
    @NotBlank(message = "newPassword is required") @Size(max = 128) String newPassword
) {
}
