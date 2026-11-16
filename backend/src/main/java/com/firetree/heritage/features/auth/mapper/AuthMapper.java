package com.firetree.heritage.features.auth.mapper;

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
import org.springframework.stereotype.Component;
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
import com.firetree.heritage.features.auth.service.AuthVerificationService;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class AuthMapper {

    private static final String TOKEN_HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60;
    private static final Set<String> INHERITOR_PERMISSION_CODES = Set.of(
        "dashboard:view",
        "graph:view",
        "application:manage",
        "community:view",
        "product:view"
    );

    private final MybatisSqlExecutor sqlExecutor;
    private final AuthVerificationService verificationService;
    private final String tokenSecret;
    private final Path uploadRoot;

    public AuthMapper(
        MybatisSqlExecutor sqlExecutor,
        AuthVerificationService verificationService,
        @Value("${heritage.auth.token-secret:fire-tree-local-development-secret}") String tokenSecret,
        @Value("${heritage.media.upload-dir:uploads/media}") String uploadDir
    ) {
        this.sqlExecutor = sqlExecutor;
        this.verificationService = verificationService;
        this.tokenSecret = tokenSecret;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public Map<String, Object> login(LoginRequest request) {
        verificationService.verifyCaptcha(request.captchaId(), request.captchaCode());
        Map<String, Object> user = findActiveUserByUsername(request.username().trim());
        String storedPassword = String.valueOf(user.get("passwordHash"));
        if (!passwordMatches(request.password(), storedPassword)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        sqlExecutor.update("update sys_users set last_login_at = now() where id = ?", user.get("id"));
        user.remove("passwordHash");
        return authPayload(user, createToken(user));
    }

    public Map<String, Object> currentUser(String authorization) {
        long userId = verifyToken(authorization);
        Map<String, Object> user = findActiveUserById(userId);
        user.remove("passwordHash");
        return authPayload(user, null);
    }

    public Map<String, Object> createCaptcha() {
        return verificationService.createCaptcha();
    }

    public Map<String, Object> sendEmailCode(EmailCodeRequest request) {
        return verificationService.sendEmailCode(
            request.email(),
            request.purpose(),
            request.captchaId(),
            request.captchaCode()
        );
    }

    @Transactional
    public Map<String, Object> updateProfile(String authorization, ProfileUpdateRequest request) {
        long userId = verifyToken(authorization);
        Map<String, Object> currentUser = findActiveUserById(userId);
        String nickname = request.nickname() == null || request.nickname().isBlank()
            ? String.valueOf(currentUser.get("nickname"))
            : request.nickname().trim();

        try {
            sqlExecutor.update("""
                update sys_users
                set nickname = ?, real_name = ?, phone = ?, email = ?, avatar_url = ?
                where id = ? and deleted = 0 and status = 1
                """,
                nickname,
                blankToNull(request.realName()),
                blankToNull(request.phone()),
                blankToNull(request.email()),
                blankToNull(request.avatarUrl()),
                userId
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone or email already exists");
        }

        Map<String, Object> user = findActiveUserById(userId);
        user.remove("passwordHash");
        return authPayload(user, null);
    }

    @Transactional
    public Map<String, Object> uploadAvatar(String authorization, MultipartFile file) {
        long userId = verifyToken(authorization);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "avatar image file is required");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only image upload is supported");
        }

        String originalName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
            ? "avatar"
            : Path.of(file.getOriginalFilename()).getFileName().toString();
        LocalDate today = LocalDate.now();
        String relativeKey = "avatars/%d/%04d/%02d/%s%s".formatted(
            userId,
            today.getYear(),
            today.getMonthValue(),
            UUID.randomUUID(),
            imageExtensionFrom(originalName, contentType)
        );
        Path target = uploadRoot.resolve(relativeKey).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid upload path");
        }

        try {
            Files.createDirectories(target.getParent());
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "avatar image save failed");
        }

        String avatarUrl = "/uploads/media/" + relativeKey.replace('\\', '/');
        sqlExecutor.update("""
            update sys_users
            set avatar_url = ?
            where id = ? and deleted = 0 and status = 1
            """, avatarUrl, userId);

        Map<String, Object> user = findActiveUserById(userId);
        user.remove("passwordHash");
        Map<String, Object> result = new LinkedHashMap<>(authPayload(user, null));
        result.put("avatarUrl", avatarUrl);
        return result;
    }

    @Transactional
    public Map<String, Object> changePassword(String authorization, PasswordChangeRequest request) {
        long userId = verifyToken(authorization);
        Map<String, Object> user = findActiveUserById(userId);
        String storedPassword = String.valueOf(user.get("passwordHash"));
        if (!passwordMatches(request.oldPassword(), storedPassword)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Old password is incorrect");
        }

        sqlExecutor.update("""
            update sys_users
            set password_hash = ?
            where id = ? and deleted = 0 and status = 1
            """, "{noop}" + request.newPassword(), userId);

        user = findActiveUserById(userId);
        user.remove("passwordHash");
        return authPayload(user, null);
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        verificationService.verifyEmailCode(request.email(), "REGISTER", request.emailCode());
        String userType = normalizeUserType(request.userType());
        if ("SUPER_ADMIN".equals(userType)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin account registration requires approval by an existing administrator");
        }
        String nickname = request.nickname() == null || request.nickname().isBlank()
            ? request.username()
            : request.nickname().trim();

        try {
            sqlExecutor.update("""
                insert into sys_users (username, password_hash, nickname, user_type, email, phone)
                values (?, ?, ?, ?, ?, ?)
                """,
                request.username().trim(),
                "{noop}" + request.password(),
                nickname,
                userType,
                request.email().trim().toLowerCase(),
                blankToNull(request.phone())
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username, phone, or email already exists");
        }

        Map<String, Object> user = findActiveUserByUsername(request.username().trim());
        long userId = ((Number) user.get("id")).longValue();
        sqlExecutor.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = ?
            on duplicate key update user_id = values(user_id)
            """, userId, defaultRoleCode(userType));
        user.remove("passwordHash");
        return authPayload(user, createToken(user));
    }

    @Transactional
    public Map<String, Object> resetPassword(PasswordResetRequest request) {
        verificationService.verifyEmailCode(request.email(), "RESET_PASSWORD", request.emailCode());
        Map<String, Object> user = findActiveUserByEmail(request.email().trim().toLowerCase());
        sqlExecutor.update("""
            update sys_users
            set password_hash = ?
            where id = ? and deleted = 0 and status = 1
            """, "{noop}" + request.newPassword(), user.get("id"));
        user = findActiveUserById(((Number) user.get("id")).longValue());
        user.remove("passwordHash");
        return authPayload(user, null);
    }

    public long requireUserId(String authorization) {
        return verifyToken(authorization);
    }

    public Map<String, Object> requireCurrentUser(String authorization) {
        long userId = verifyToken(authorization);
        Map<String, Object> user = findActiveUserById(userId);
        user.remove("passwordHash");
        return authPayload(user, null);
    }

    private Map<String, Object> authPayload(Map<String, Object> user, String token) {
        long userId = ((Number) user.get("id")).longValue();
        String userType = String.valueOf(user.get("userType"));
        List<Map<String, Object>> roles = rolesForUser(userId, userType);
        List<String> roleCodes = roles.stream().map(role -> String.valueOf(role.get("roleCode"))).toList();
        List<Map<String, Object>> permissions = permissionsForRoles(roleCodes);
        List<Map<String, Object>> menus = permissions.stream()
            .filter(permission -> "MENU".equals(permission.get("permissionType")))
            .toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        if (token != null) {
            payload.put("token", token);
            payload.put("tokenType", "Bearer");
            payload.put("expiresIn", TOKEN_TTL_SECONDS);
        }
        payload.put("user", user);
        payload.put("roles", roles);
        payload.put("permissions", permissions);
        payload.put("menus", menus);
        return payload;
    }

    private Map<String, Object> findActiveUserByUsername(String username) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  id,
                  username,
                  password_hash as passwordHash,
                  nickname,
                  real_name as realName,
                  phone,
                  email,
                  avatar_url as avatarUrl,
                  user_type as userType,
                  status,
                  last_login_at as lastLoginAt
                from sys_users
                where username = ? and deleted = 0 and status = 1
                """, username);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
    }

    private Map<String, Object> findActiveUserById(long userId) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  id,
                  username,
                  password_hash as passwordHash,
                  nickname,
                  real_name as realName,
                  phone,
                  email,
                  avatar_url as avatarUrl,
                  user_type as userType,
                  status,
                  last_login_at as lastLoginAt
                from sys_users
                where id = ? and deleted = 0 and status = 1
                """, userId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
    }

    private Map<String, Object> findActiveUserByEmail(String email) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  id,
                  username,
                  password_hash as passwordHash,
                  nickname,
                  real_name as realName,
                  phone,
                  email,
                  avatar_url as avatarUrl,
                  user_type as userType,
                  status,
                  last_login_at as lastLoginAt
                from sys_users
                where email = ? and deleted = 0 and status = 1
                """, email);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is not registered");
        }
    }

    private List<Map<String, Object>> rolesForUser(long userId, String userType) {
        List<Map<String, Object>> roles = sqlExecutor.queryForList("""
            select r.id, r.role_code as roleCode, r.role_name as roleName, r.description
            from sys_user_roles ur
            join sys_roles r on r.id = ur.role_id
            where ur.user_id = ? and r.deleted = 0 and r.status = 1
            order by r.id
            """, userId);

        if (!roles.isEmpty()) {
            return roles;
        }

        return sqlExecutor.queryForList("""
            select id, role_code as roleCode, role_name as roleName, description
            from sys_roles
            where role_code = ? and deleted = 0 and status = 1
            """, defaultRoleCode(userType));
    }

    private List<Map<String, Object>> permissionsForRoles(List<String> roleCodes) {
        if (roleCodes.isEmpty()) {
            return List.of();
        }
        if (!roleCodes.contains("SUPER_ADMIN")) {
            if (roleCodes.contains("INHERITOR")) {
                return permissionsForCodes(INHERITOR_PERMISSION_CODES);
            }
            return List.of();
        }

        String placeholders = String.join(",", roleCodes.stream().map(role -> "?").toList());
        return sqlExecutor.queryForList("""
            select distinct
              p.id,
              p.permission_code as permissionCode,
              p.permission_name as permissionName,
              p.permission_type as permissionType,
              p.route_path as routePath,
              p.icon,
              p.sort_order as sortOrder
            from sys_permissions p
            join sys_role_permissions rp on rp.permission_id = p.id
            join sys_roles r on r.id = rp.role_id
            where r.role_code in (%s)
              and r.deleted = 0
              and r.status = 1
              and p.deleted = 0
              and p.status = 1
              and p.visible = 1
            order by p.sort_order, p.id
            """.formatted(placeholders), roleCodes.toArray());
    }

    private List<Map<String, Object>> permissionsForCodes(Set<String> permissionCodes) {
        if (permissionCodes.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", permissionCodes.stream().map(code -> "?").toList());
        return sqlExecutor.queryForList("""
            select distinct
              p.id,
              p.permission_code as permissionCode,
              p.permission_name as permissionName,
              p.permission_type as permissionType,
              p.route_path as routePath,
              p.icon,
              p.sort_order as sortOrder
            from sys_permissions p
            where p.permission_code in (%s)
              and p.deleted = 0
              and p.status = 1
              and p.visible = 1
            order by p.sort_order, p.id
            """.formatted(placeholders), permissionCodes.toArray());
    }

    private String defaultRoleCode(String userType) {
        return switch (userType) {
            case "SUPER_ADMIN" -> "SUPER_ADMIN";
            case "INHERITOR" -> "INHERITOR";
            default -> "NORMAL_USER";
        };
    }

    private String normalizeUserType(String userType) {
        if (userType == null || userType.isBlank()) {
            return "NORMAL";
        }
        String normalized = userType.trim().toUpperCase();
        if (List.of("SUPER_ADMIN", "INHERITOR", "NORMAL").contains(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userType is invalid");
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String imageExtensionFrom(String originalName, String contentType) {
        String lowerName = originalName.toLowerCase();
        int dotIndex = lowerName.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < lowerName.length() - 1) {
            String extension = lowerName.substring(dotIndex);
            if (List.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(extension)) {
                return extension;
            }
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword.startsWith("{noop}")) {
            return storedPassword.substring("{noop}".length()).equals(rawPassword);
        }
        return storedPassword.equals(rawPassword);
    }

    private String createToken(Map<String, Object> user) {
        String header = encode(TOKEN_HEADER);
        long expiresAt = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String payload = "sub=%s;username=%s;exp=%s".formatted(user.get("id"), user.get("username"), expiresAt);
        String unsigned = header + "." + encode(payload);
        return unsigned + "." + sign(unsigned);
    }

    private long verifyToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        String token = authorization.substring("Bearer ".length()).trim();
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }

        String unsigned = parts[0] + "." + parts[1];
        if (!sign(unsigned).equals(parts[2])) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }

        Map<String, String> payload = parsePayload(decode(parts[1]));
        long expiresAt = Long.parseLong(payload.getOrDefault("exp", "0"));
        if (Instant.now().getEpochSecond() > expiresAt) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token expired");
        }

        return Long.parseLong(payload.get("sub"));
    }

    private Map<String, String> parsePayload(String payload) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String entry : payload.split(";")) {
            String[] pair = entry.split("=", 2);
            if (pair.length == 2) {
                values.put(pair[0], pair[1]);
            }
        }
        if (!values.containsKey("sub")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
        return values;
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign auth token", exception);
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
