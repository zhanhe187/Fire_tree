package com.firetree.heritage.features.auth.controller;

import com.firetree.heritage.features.auth.dto.EmailCodeRequest;
import com.firetree.heritage.features.auth.dto.LoginRequest;
import com.firetree.heritage.features.auth.dto.PasswordChangeRequest;
import com.firetree.heritage.features.auth.dto.PasswordResetRequest;
import com.firetree.heritage.features.auth.dto.ProfileUpdateRequest;
import com.firetree.heritage.features.auth.dto.RegisterRequest;
import com.firetree.heritage.features.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @GetMapping("/captcha")
    public Map<String, Object> captcha() {
        return authService.createCaptcha();
    }

    @PostMapping("/email-code")
    public Map<String, Object> sendEmailCode(@Valid @RequestBody EmailCodeRequest request) {
        return authService.sendEmailCode(request);
    }

    @PostMapping("/password/reset")
    public Map<String, Object> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/me")
    public Map<String, Object> currentUser(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.currentUser(authorization);
    }

    @PutMapping("/me/profile")
    public Map<String, Object> updateProfile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfile(authorization, request);
    }

    @PostMapping("/me/avatar")
    public Map<String, Object> uploadAvatar(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam("file") MultipartFile file
    ) {
        return authService.uploadAvatar(authorization, file);
    }

    @PutMapping("/me/password")
    public Map<String, Object> changePassword(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody PasswordChangeRequest request
    ) {
        return authService.changePassword(authorization, request);
    }
}
