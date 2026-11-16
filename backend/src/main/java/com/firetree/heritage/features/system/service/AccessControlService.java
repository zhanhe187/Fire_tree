package com.firetree.heritage.features.system.service;

import com.firetree.heritage.features.auth.service.AuthService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class AccessControlService {

    private final AuthService authService;

    public AccessControlService(AuthService authService) {
        this.authService = authService;
    }

    public AuthContext requireBackstageWriter(String authorization) {
        AuthContext context = requireContext(authorization);
        if (context.hasRole("SUPER_ADMIN") || context.hasRole("INHERITOR")) {
            return context;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Backstage write permission is required");
    }

    public AuthContext requireSuperAdmin(String authorization) {
        AuthContext context = requireContext(authorization);
        if (context.hasRole("SUPER_ADMIN")) {
            return context;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin permission is required");
    }

    public AuthContext requireUser(String authorization) {
        return requireContext(authorization);
    }

    private AuthContext requireContext(String authorization) {
        Map<String, Object> payload = authService.requireCurrentUser(authorization);
        Map<?, ?> user = (Map<?, ?>) payload.get("user");
        List<?> roles = (List<?>) payload.get("roles");
        List<String> roleCodes = roles.stream()
            .map(role -> String.valueOf(((Map<?, ?>) role).get("roleCode")))
            .toList();
        return new AuthContext(((Number) user.get("id")).longValue(), roleCodes);
    }

    public record AuthContext(long userId, List<String> roleCodes) {
        public boolean hasRole(String roleCode) {
            return roleCodes.contains(roleCode);
        }

        public boolean isSuperAdmin() {
            return hasRole("SUPER_ADMIN");
        }
    }
}
