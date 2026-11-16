package com.firetree.heritage.features.auth.service;

import com.firetree.heritage.features.auth.dto.EmailCodeRequest;
import com.firetree.heritage.features.auth.dto.LoginRequest;
import com.firetree.heritage.features.auth.dto.PasswordChangeRequest;
import com.firetree.heritage.features.auth.dto.PasswordResetRequest;
import com.firetree.heritage.features.auth.dto.ProfileUpdateRequest;
import com.firetree.heritage.features.auth.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.firetree.heritage.features.auth.mapper.AuthMapper;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthMapper mapper;

    public AuthService(AuthMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> login(LoginRequest request) {
        return mapper.login(request);
    }

    public Map<String, Object> currentUser(String authorization) {
        return mapper.currentUser(authorization);
    }

    public Map<String, Object> createCaptcha() {
        return mapper.createCaptcha();
    }

    public Map<String, Object> sendEmailCode(EmailCodeRequest request) {
        return mapper.sendEmailCode(request);
    }

    public Map<String, Object> updateProfile(String authorization, ProfileUpdateRequest request) {
        return mapper.updateProfile(authorization, request);
    }

    public Map<String, Object> uploadAvatar(String authorization, MultipartFile file) {
        return mapper.uploadAvatar(authorization, file);
    }

    public Map<String, Object> changePassword(String authorization, PasswordChangeRequest request) {
        return mapper.changePassword(authorization, request);
    }

    public Map<String, Object> register(RegisterRequest request) {
        return mapper.register(request);
    }

    public Map<String, Object> resetPassword(PasswordResetRequest request) {
        return mapper.resetPassword(request);
    }

    public long requireUserId(String authorization) {
        return mapper.requireUserId(authorization);
    }

    public Map<String, Object> requireCurrentUser(String authorization) {
        return mapper.requireCurrentUser(authorization);
    }
}
