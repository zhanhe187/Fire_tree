package com.firetree.heritage.features.admin.controller;

import com.firetree.heritage.features.admin.dto.AdminUserCreateRequest;
import com.firetree.heritage.features.admin.dto.AdminUserPasswordRequest;
import com.firetree.heritage.features.admin.dto.AdminUserUpdateRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.admin.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AccessControlService accessControlService;

    public AdminUserController(AdminUserService adminUserService, AccessControlService accessControlService) {
        this.adminUserService = adminUserService;
        this.accessControlService = accessControlService;
    }

    @GetMapping
    public Map<String, Object> users(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String userType,
        @RequestParam(required = false) Integer status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return adminUserService.searchUsers(keyword, userType, status, page, size);
    }

    @PostMapping
    public Map<String, Object> createUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody AdminUserCreateRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return adminUserService.createUser(request, context.userId());
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody AdminUserUpdateRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return adminUserService.updateUser(id, request, context.userId());
    }

    @PutMapping("/{id}/password")
    public Map<String, Object> resetPassword(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody AdminUserPasswordRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return adminUserService.resetPassword(id, request, context.userId());
    }

    @DeleteMapping("/{id}")
    public void deleteUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        adminUserService.deleteUser(id, context.userId());
    }
}
