package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "username is required") @Size(max = 64) String username,
    @NotBlank(message = "password is required") @Size(max = 128) String password,
    @Size(max = 64) String nickname,
    @Size(max = 32) String userType,
    @NotBlank(message = "email is required") @Email @Size(max = 128) String email,
    @NotBlank(message = "emailCode is required") @Size(max = 12) String emailCode,
    @Size(max = 32) String phone
) {
}
