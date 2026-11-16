package com.firetree.heritage.features.governance.controller;

import com.firetree.heritage.features.governance.dto.SensitiveWordRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.governance.service.ContentGovernanceService;
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
@RequestMapping("/api/content-governance")
public class ContentGovernanceController {

    private final ContentGovernanceService contentGovernanceService;
    private final AccessControlService accessControlService;

    public ContentGovernanceController(
        ContentGovernanceService contentGovernanceService,
        AccessControlService accessControlService
    ) {
        this.contentGovernanceService = contentGovernanceService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/sensitive-words")
    public Map<String, Object> sensitiveWords(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String wordType,
        @RequestParam(required = false) Integer status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return contentGovernanceService.searchSensitiveWords(keyword, wordType, status, page, size);
    }

    @PostMapping("/sensitive-words")
    public Map<String, Object> createSensitiveWord(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody SensitiveWordRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return contentGovernanceService.createSensitiveWord(request, context.userId());
    }

    @PutMapping("/sensitive-words/{id}")
    public Map<String, Object> updateSensitiveWord(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody SensitiveWordRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return contentGovernanceService.updateSensitiveWord(id, request, context.userId());
    }

    @DeleteMapping("/sensitive-words/{id}")
    public void deleteSensitiveWord(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        contentGovernanceService.deleteSensitiveWord(id, context.userId());
    }

    @GetMapping("/review-records")
    public Map<String, Object> reviewRecords(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String contentType,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return contentGovernanceService.searchReviewRecords(keyword, contentType, status, page, size);
    }

    @GetMapping("/operation-logs")
    public Map<String, Object> operationLogs(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return contentGovernanceService.operationLogs(keyword, page, size);
    }
}
