package com.firetree.heritage.features.application.controller;

import com.firetree.heritage.features.application.dto.ApplicationRequest;
import com.firetree.heritage.features.application.dto.ReviewDecisionRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.application.service.ApplicationReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationReviewService applicationReviewService;
    private final AccessControlService accessControlService;

    public ApplicationController(ApplicationReviewService applicationReviewService, AccessControlService accessControlService) {
        this.applicationReviewService = applicationReviewService;
        this.accessControlService = accessControlService;
    }

    @GetMapping
    public Map<String, Object> applications(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String applicationType,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            return applicationReviewService.searchApplicationsForUser(context.userId(), keyword, status, applicationType, page, size);
        }
        return applicationReviewService.searchApplications(keyword, status, applicationType, page, size);
    }

    @GetMapping("/{id}")
    public Map<String, Object> application(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            return applicationReviewService.getApplicationForUser(id, context.userId());
        }
        return applicationReviewService.getApplication(id);
    }

    @PostMapping
    public Map<String, Object> createApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ApplicationRequest request
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            return applicationReviewService.createApplicationForUser(request, context.userId());
        }
        return applicationReviewService.createApplication(request);
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ApplicationRequest request
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            return applicationReviewService.updateApplicationForUser(id, request, context.userId());
        }
        return applicationReviewService.updateApplication(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            applicationReviewService.deleteApplicationForUser(id, context.userId());
            return;
        }
        applicationReviewService.deleteApplication(id);
    }

    @PutMapping("/{id}/submit")
    public Map<String, Object> submitApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        var context = accessControlService.requireUser(authorization);
        if (!context.isSuperAdmin()) {
            return applicationReviewService.submitApplicationForUser(id, context.userId());
        }
        return applicationReviewService.submitApplication(id);
    }

    @PutMapping("/{id}/approve")
    public Map<String, Object> approveApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ReviewDecisionRequest request
    ) {
        var context = accessControlService.requireSuperAdmin(authorization);
        return applicationReviewService.reviewApplication(id, "APPROVED", request, context.userId());
    }

    @PutMapping("/{id}/reject")
    public Map<String, Object> rejectApplication(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ReviewDecisionRequest request
    ) {
        var context = accessControlService.requireSuperAdmin(authorization);
        return applicationReviewService.reviewApplication(id, "REJECTED", request, context.userId());
    }
}
