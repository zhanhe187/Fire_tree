package com.firetree.heritage.features.system.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import com.firetree.heritage.features.system.service.AuditLogService;

@Component
public class AuditLogMapper {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditLogService.class);

    private final MybatisSqlExecutor sqlExecutor;
    private final ObjectMapper objectMapper;

    public AuditLogMapper(MybatisSqlExecutor sqlExecutor, ObjectMapper objectMapper) {
        this.sqlExecutor = sqlExecutor;
        this.objectMapper = objectMapper;
    }

    public void recordSearch(Long userId, String keyword, String searchType, int resultCount) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        runQuietly(() -> sqlExecutor.update("""
            insert into search_logs (user_id, keyword, search_type, result_count)
            values (?, ?, ?, ?)
            """, userId, keyword.trim(), normalizeSearchType(searchType), Math.max(resultCount, 0)));
    }

    public void recordBehavior(Long userId, String behaviorType, String targetType, Long targetId, Map<String, Object> extraData) {
        runQuietly(() -> sqlExecutor.update("""
            insert into user_behavior_logs (user_id, behavior_type, target_type, target_id, extra_data)
            values (?, ?, ?, ?, cast(? as json))
            """, userId, behaviorType, targetType, targetId, toJson(extraData)));
    }

    public void recordOperation(Long operatorId, String operation, String resourceType, Long resourceId, String method, String uri, Map<String, Object> body) {
        runQuietly(() -> sqlExecutor.update("""
            insert into operation_logs (
              operator_id, operation, resource_type, resource_id, request_method, request_uri, request_body, success
            ) values (?, ?, ?, ?, ?, ?, cast(? as json), 1)
            """, operatorId, operation, resourceType, resourceId, method, uri, toJson(body)));
    }

    private String normalizeSearchType(String searchType) {
        if (searchType == null || searchType.isBlank()) {
            return "KEYWORD";
        }
        String normalized = searchType.trim().toUpperCase();
        return switch (normalized) {
            case "SEMANTIC", "TAG" -> normalized;
            default -> "KEYWORD";
        };
    }

    private String toJson(Map<String, Object> value) {
        if (value == null || value.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }

    private void runQuietly(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException exception) {
            LOGGER.warn("Audit log write skipped: {}", exception.getMessage());
        }
    }
}

