package com.firetree.heritage.features.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailCodeRequest(
    @NotBlank(message = "email is required") @Email @Size(max = 128) String email,
    @NotBlank(message = "purpose is required") @Size(max = 32) String purpose,
    @NotBlank(message = "captchaId is required") String captchaId,
    @NotBlank(message = "captchaCode is required") String captchaCode
) {
}
