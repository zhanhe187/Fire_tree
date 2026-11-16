package com.firetree.heritage.features.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import com.firetree.heritage.features.system.service.EmailDeliveryService;

@Service
public class AuthVerificationService {

    private static final List<String> PURPOSES = List.of("REGISTER", "RESET_PASSWORD");
    private static final char[] CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, CodeEntry> captchaCodes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CodeEntry> emailCodes = new ConcurrentHashMap<>();
    private final EmailDeliveryService emailDeliveryService;
    private final long captchaTtlSeconds;
    private final long emailCodeTtlSeconds;
    private final boolean debugCodeEnabled;

    public AuthVerificationService(
        EmailDeliveryService emailDeliveryService,
        @Value("${heritage.auth.captcha-ttl-seconds:300}") long captchaTtlSeconds,
        @Value("${heritage.auth.email-code-ttl-seconds:600}") long emailCodeTtlSeconds,
        @Value("${heritage.auth.debug-code-enabled:true}") boolean debugCodeEnabled
    ) {
        this.emailDeliveryService = emailDeliveryService;
        this.captchaTtlSeconds = captchaTtlSeconds;
        this.emailCodeTtlSeconds = emailCodeTtlSeconds;
        this.debugCodeEnabled = debugCodeEnabled;
    }

    public Map<String, Object> createCaptcha() {
        String captchaId = UUID.randomUUID().toString();
        String code = randomCaptchaCode();
        captchaCodes.put(captchaId, new CodeEntry(code, Instant.now().plusSeconds(captchaTtlSeconds)));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("captchaId", captchaId);
        payload.put("captchaImage", "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svg(code).getBytes(StandardCharsets.UTF_8)));
        payload.put("expiresIn", captchaTtlSeconds);
        if (debugCodeEnabled) {
            payload.put("debugCode", code);
        }
        return payload;
    }

    public void verifyCaptcha(String captchaId, String captchaCode) {
        CodeEntry entry = captchaCodes.remove(captchaId);
        if (entry == null || entry.expired() || !entry.matches(captchaCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码无效或已过期");
        }
    }

    public Map<String, Object> sendEmailCode(String email, String purpose, String captchaId, String captchaCode) {
        verifyCaptcha(captchaId, captchaCode);
        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);
        String code = randomEmailCode();
        emailCodes.put(emailKey(normalizedEmail, normalizedPurpose), new CodeEntry(code, Instant.now().plusSeconds(emailCodeTtlSeconds)));
        emailDeliveryService.sendVerificationCode(normalizedEmail, normalizedPurpose, code, emailCodeTtlSeconds);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("email", normalizedEmail);
        payload.put("purpose", normalizedPurpose);
        payload.put("expiresIn", emailCodeTtlSeconds);
        if (debugCodeEnabled) {
            payload.put("debugCode", code);
        }
        return payload;
    }

    public void verifyEmailCode(String email, String purpose, String emailCode) {
        CodeEntry entry = emailCodes.remove(emailKey(normalizeEmail(email), normalizePurpose(purpose)));
        if (entry == null || entry.expired() || !entry.matches(emailCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email code is invalid or expired");
        }
    }

    private String randomCaptchaCode() {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            builder.append(CAPTCHA_CHARS[random.nextInt(CAPTCHA_CHARS.length)]);
        }
        return builder.toString();
    }

    private String randomEmailCode() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    private String normalizePurpose(String purpose) {
        String normalized = purpose == null ? "" : purpose.trim().toUpperCase(Locale.ROOT);
        if (!PURPOSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email code purpose is invalid");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String emailKey(String email, String purpose) {
        return purpose + ":" + email;
    }

    private String svg(String code) {
        return """
            <svg xmlns="http://www.w3.org/2000/svg" width="132" height="44" viewBox="0 0 132 44">
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stop-color="#fff8ea"/>
                  <stop offset="1" stop-color="#f2cf91"/>
                </linearGradient>
              </defs>
              <rect width="132" height="44" rx="10" fill="url(#g)"/>
              <path d="M8 31 C32 10, 55 42, 80 17 S113 35, 126 13" fill="none" stroke="#bd4633" stroke-width="2" opacity=".42"/>
              <path d="M10 12 H122 M18 36 H116" stroke="#271d15" stroke-width="1" opacity=".12"/>
              <text x="66" y="29" text-anchor="middle" font-family="Consolas, monospace" font-size="24" font-weight="700" letter-spacing="5" fill="#271d15">%s</text>
            </svg>
            """.formatted(code);
    }

    private record CodeEntry(String code, Instant expiresAt) {
        boolean expired() {
            return Instant.now().isAfter(expiresAt);
        }

        boolean matches(String value) {
            return code.equalsIgnoreCase(value == null ? "" : value.trim());
        }
    }
}
