package com.firetree.heritage.features.analytics.controller;

import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.analytics.service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AccessControlService accessControlService;

    public AnalyticsController(AnalyticsService analyticsService, AccessControlService accessControlService) {
        this.analyticsService = analyticsService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestHeader(value = "Authorization", required = false) String authorization) {
        accessControlService.requireSuperAdmin(authorization);
        return analyticsService.overview();
    }

    @GetMapping("/search-hot")
    public Map<String, Object> searchHot(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(defaultValue = "10") int limit
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return analyticsService.searchHot(limit);
    }

    @GetMapping("/behavior-trend")
    public Map<String, Object> behaviorTrend(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(defaultValue = "7") int days
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return analyticsService.behaviorTrend(days);
    }

    @GetMapping("/operation-audit")
    public Map<String, Object> operationAudit(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return analyticsService.operationAudit(keyword, page, size);
    }
}
