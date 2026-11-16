package com.firetree.heritage.features.admin.mapper;

import com.firetree.heritage.features.admin.dto.AdminUserCreateRequest;
import com.firetree.heritage.features.admin.dto.AdminUserPasswordRequest;
import com.firetree.heritage.features.admin.dto.AdminUserUpdateRequest;
import com.firetree.heritage.features.system.service.AuditLogService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class AdminUserMapper {

    private static final List<String> VALID_USER_TYPES = List.of("SUPER_ADMIN", "INHERITOR", "NORMAL");

    private final MybatisSqlExecutor sqlExecutor;
    private final AuditLogService auditLogService;

    public AdminUserMapper(MybatisSqlExecutor sqlExecutor, AuditLogService auditLogService) {
        this.sqlExecutor = sqlExecutor;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> searchUsers(String keyword, String userType, Integer status, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, userType, status, params);

        Integer total = sqlExecutor.queryForObject("select count(*) from sys_users u where " + where, Integer.class, params.toArray());
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              u.id,
              u.username,
              u.nickname,
              u.real_name as realName,
              u.phone,
              u.email,
              u.avatar_url as avatarUrl,
              u.user_type as userType,
              u.status,
              u.last_login_at as lastLoginAt,
              u.created_at as createdAt,
              u.updated_at as updatedAt,
              group_concat(r.role_code order by r.id separator ',') as roleCodes,
              group_concat(r.role_name order by r.id separator ',') as roleNames
            from sys_users u
            left join sys_user_roles ur on ur.user_id = u.id
            left join sys_roles r on r.id = ur.role_id and r.deleted = 0
            where %s
            group by u.id
            order by u.created_at desc, u.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    @Transactional
    public Map<String, Object> createUser(AdminUserCreateRequest request, long operatorId) {
        String userType = request.userType() == null || request.userType().isBlank()
            ? "NORMAL"
            : normalizeUserType(request.userType());
        String nickname = request.nickname() == null || request.nickname().isBlank()
            ? request.username()
            : request.nickname().trim();
        if (request.password() == null || request.password().isBlank() || request.password().trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
        }

        try {
            sqlExecutor.update("""
                insert into sys_users (username, password_hash, nickname, user_type, phone, email)
                values (?, ?, ?, ?, ?, ?)
                """,
                request.username().trim(),
                "{noop}" + request.password().trim(),
                nickname,
                userType,
                blankToNull(request.phone()),
                blankToNull(request.email())
            );
        } catch (DataIntegrityViolationException exception) {
            // Purge ghost soft-deleted rows that may still occupy unique keys, then retry once
            sqlExecutor.update("delete from sys_users where username = ? and deleted = 1", request.username().trim());
            if (request.phone() != null && !request.phone().isBlank()) {
                sqlExecutor.update("delete from sys_users where phone = ? and deleted = 1", request.phone().trim());
            }
            if (request.email() != null && !request.email().isBlank()) {
                sqlExecutor.update("delete from sys_users where email = ? and deleted = 1", request.email().trim());
            }
            try {
                sqlExecutor.update("""
                    insert into sys_users (username, password_hash, nickname, user_type, phone, email)
                    values (?, ?, ?, ?, ?, ?)
                    """,
                    request.username().trim(),
                    "{noop}" + request.password().trim(),
                    nickname,
                    userType,
                    blankToNull(request.phone()),
                    blankToNull(request.email())
                );
            } catch (DataIntegrityViolationException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username, phone, or email already exists");
            }
        }

        Map<String, Object> user = findUserByUsername(request.username().trim());
        long userId = ((Number) user.get("id")).longValue();
        syncPrimaryRole(userId, userType);
        auditLogService.recordOperation(operatorId, "ADMIN_USER_CREATE", "USER", userId, "POST", "/api/admin/users", Map.of());
        return userById(userId);
    }

    @Transactional
    public Map<String, Object> updateUser(long id, AdminUserUpdateRequest request, long operatorId) {
        ensureUserExists(id);
        String userType = request.userType() == null || request.userType().isBlank() ? null : normalizeUserType(request.userType());
        Integer status = request.status();
        if (status != null && status != 0 && status != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        }
        try {
            sqlExecutor.update("""
                update sys_users
                set
                  nickname = coalesce(?, nickname),
                  real_name = ?,
                  phone = ?,
                  email = ?,
                  user_type = coalesce(?, user_type),
                  status = coalesce(?, status)
                where id = ? and deleted = 0
                """,
                blankToNull(request.nickname()),
                blankToNull(request.realName()),
                blankToNull(request.phone()),
                blankToNull(request.email()),
                userType,
                status,
                id
            );
            if (userType != null) {
                syncPrimaryRole(id, userType);
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username, phone, or email already exists");
        }
        auditLogService.recordOperation(operatorId, "ADMIN_USER_UPDATE", "USER", id, "PUT", "/api/admin/users/" + id, Map.of());
        return userById(id);
    }

    @Transactional
    public Map<String, Object> resetPassword(long id, AdminUserPasswordRequest request, long operatorId) {
        ensureUserExists(id);
        if (request.newPassword() == null || request.newPassword().isBlank() || request.newPassword().trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "newPassword is required");
        }
        sqlExecutor.update("""
            update sys_users
            set password_hash = ?
            where id = ? and deleted = 0
            """, "{noop}" + request.newPassword().trim(), id);
        auditLogService.recordOperation(operatorId, "ADMIN_USER_PASSWORD_RESET", "USER", id, "PUT", "/api/admin/users/" + id + "/password", Map.of());
        return userById(id);
    }

    @Transactional
    public void deleteUser(long id, long operatorId) {
        ensureUserExists(id);
        if (id == operatorId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete current user");
        }
        // Physical delete to prevent ghost rows from blocking unique-key re-creation
        sqlExecutor.update("delete from sys_users where id = ?", id);
        auditLogService.recordOperation(operatorId, "ADMIN_USER_DELETE", "USER", id, "DELETE", "/api/admin/users/" + id, Map.of());
    }

    private String buildWhere(String keyword, String userType, Integer status, List<Object> params) {
        StringBuilder where = new StringBuilder("u.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (u.username like ? or u.nickname like ? or u.real_name like ? or u.phone like ? or u.email like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (userType != null && !userType.isBlank()) {
            where.append(" and u.user_type = ?");
            params.add(normalizeUserType(userType));
        }
        if (status != null) {
            if (status != 0 && status != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
            }
            where.append(" and u.status = ?");
            params.add(status);
        }
        return where.toString();
    }

    private Map<String, Object> userById(long id) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  u.id,
                  u.username,
                  u.nickname,
                  u.real_name as realName,
                  u.phone,
                  u.email,
                  u.avatar_url as avatarUrl,
                  u.user_type as userType,
                  u.status,
                  u.last_login_at as lastLoginAt,
                  u.created_at as createdAt,
                  u.updated_at as updatedAt
                from sys_users u
                where u.id = ? and u.deleted = 0
                """, id);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private Map<String, Object> findUserByUsername(String username) {
        try {
            return sqlExecutor.queryForMap("""
                select id, username from sys_users
                where username = ? and deleted = 0
                """, username);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private void ensureUserExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from sys_users where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private void syncPrimaryRole(long userId, String userType) {
        sqlExecutor.update("delete from sys_user_roles where user_id = ?", userId);
        sqlExecutor.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = ?
            """, userId, defaultRoleCode(userType));
    }

    private String defaultRoleCode(String userType) {
        return switch (userType) {
            case "SUPER_ADMIN" -> "SUPER_ADMIN";
            case "INHERITOR" -> "INHERITOR";
            default -> "NORMAL_USER";
        };
    }

    private String normalizeUserType(String value) {
        String normalized = value.trim().toUpperCase();
        if (!VALID_USER_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userType is invalid");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
