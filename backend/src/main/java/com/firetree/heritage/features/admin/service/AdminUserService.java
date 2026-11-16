package com.firetree.heritage.features.admin.service;

import com.firetree.heritage.features.admin.dto.AdminUserCreateRequest;
import com.firetree.heritage.features.admin.dto.AdminUserPasswordRequest;
import com.firetree.heritage.features.admin.dto.AdminUserUpdateRequest;
import com.firetree.heritage.features.admin.mapper.AdminUserMapper;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AdminUserService {

    private final AdminUserMapper mapper;

    public AdminUserService(AdminUserMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchUsers(String keyword, String userType, Integer status, int page, int size) {
        return mapper.searchUsers(keyword, userType, status, page, size);
    }

    public Map<String, Object> createUser(AdminUserCreateRequest request, long operatorId) {
        return mapper.createUser(request, operatorId);
    }

    public Map<String, Object> updateUser(long id, AdminUserUpdateRequest request, long operatorId) {
        return mapper.updateUser(id, request, operatorId);
    }

    public Map<String, Object> resetPassword(long id, AdminUserPasswordRequest request, long operatorId) {
        return mapper.resetPassword(id, request, operatorId);
    }

    public void deleteUser(long id, long operatorId) {
        mapper.deleteUser(id, operatorId);
    }
}
