package com.firetree.heritage.features.governance.service;

import com.firetree.heritage.features.governance.dto.SensitiveWordRequest;
import com.firetree.heritage.features.analytics.mapper.AnalyticsMapper;
import com.firetree.heritage.features.governance.mapper.ContentGovernanceMapper;
import org.springframework.stereotype.Service;

import java.util.Map;
import com.firetree.heritage.features.system.service.AuditLogService;

@Service
public class ContentGovernanceService {

    private final ContentGovernanceMapper mapper;
    private final AnalyticsMapper analyticsMapper;
    private final AuditLogService auditLogService;

    public ContentGovernanceService(
        ContentGovernanceMapper mapper,
        AnalyticsMapper analyticsMapper,
        AuditLogService auditLogService
    ) {
        this.mapper = mapper;
        this.analyticsMapper = analyticsMapper;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> searchSensitiveWords(String keyword, String wordType, Integer status, int page, int size) {
        return mapper.searchSensitiveWords(keyword, wordType, status, page, size);
    }

    public Map<String, Object> createSensitiveWord(SensitiveWordRequest request, long operatorId) {
        Map<String, Object> created = mapper.createSensitiveWord(request, operatorId);
        auditLogService.recordOperation(
            operatorId,
            "SENSITIVE_WORD_CREATE",
            "SENSITIVE_WORD",
            ((Number) created.get("id")).longValue(),
            "POST",
            "/api/content-governance/sensitive-words",
            Map.of("word", created.get("word"), "wordType", created.get("wordType"), "severity", created.get("severity"))
        );
        return created;
    }

    public Map<String, Object> updateSensitiveWord(long id, SensitiveWordRequest request, long operatorId) {
        Map<String, Object> updated = mapper.updateSensitiveWord(id, request);
        auditLogService.recordOperation(
            operatorId,
            "SENSITIVE_WORD_UPDATE",
            "SENSITIVE_WORD",
            id,
            "PUT",
            "/api/content-governance/sensitive-words/" + id,
            Map.of("word", updated.get("word"), "wordType", updated.get("wordType"), "severity", updated.get("severity"), "status", updated.get("status"))
        );
        return updated;
    }

    public void deleteSensitiveWord(long id, long operatorId) {
        mapper.deleteSensitiveWord(id);
        auditLogService.recordOperation(
            operatorId,
            "SENSITIVE_WORD_DELETE",
            "SENSITIVE_WORD",
            id,
            "DELETE",
            "/api/content-governance/sensitive-words/" + id,
            Map.of()
        );
    }

    public Map<String, Object> searchReviewRecords(String keyword, String contentType, String status, int page, int size) {
        return mapper.searchReviewRecords(keyword, contentType, status, page, size);
    }

    public Map<String, Object> operationLogs(String keyword, int page, int size) {
        return analyticsMapper.operationAudit(keyword, page, size);
    }
}
