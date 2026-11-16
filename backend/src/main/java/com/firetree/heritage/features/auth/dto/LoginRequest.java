package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "username is required") String username,
    @NotBlank(message = "password is required") String password,
    @NotBlank(message = "captchaId is required") String captchaId,
    @NotBlank(message = "captchaCode is required") String captchaCode
) {
}
