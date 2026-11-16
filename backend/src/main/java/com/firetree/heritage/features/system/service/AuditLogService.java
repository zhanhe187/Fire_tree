package com.firetree.heritage.features.system.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.AuditLogMapper;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogMapper mapper;

    public AuditLogService(AuditLogMapper mapper) {
        this.mapper = mapper;
    }

    public void recordSearch(Long userId, String keyword, String searchType, int resultCount) {
        mapper.recordSearch(userId, keyword, searchType, resultCount);
    }

    public void recordBehavior(Long userId, String behaviorType, String targetType, Long targetId, Map<String, Object> extraData) {
        mapper.recordBehavior(userId, behaviorType, targetType, targetId, extraData);
    }

    public void recordOperation(Long operatorId, String operation, String resourceType, Long resourceId, String method, String uri, Map<String, Object> body) {
        mapper.recordOperation(operatorId, operation, resourceType, resourceId, method, uri, body);
    }
}
