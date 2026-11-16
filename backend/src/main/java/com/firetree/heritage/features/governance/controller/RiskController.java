package com.firetree.heritage.features.governance.controller;

import com.firetree.heritage.features.governance.dto.RiskResolveRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.governance.service.RiskReportService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/risk")
public class RiskController {

    private final RiskReportService riskReportService;
    private final AccessControlService accessControlService;

    public RiskController(RiskReportService riskReportService, AccessControlService accessControlService) {
        this.riskReportService = riskReportService;
        this.accessControlService = accessControlService;
    }

    @PostMapping("/scan")
    public Map<String, Object> scan(@RequestHeader(value = "Authorization", required = false) String authorization) {
        accessControlService.requireSuperAdmin(authorization);
        return riskReportService.scan();
    }

    @GetMapping("/reports")
    public Map<String, Object> reports(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String severity,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return riskReportService.reports(keyword, severity, status, page, size);
    }

    @PutMapping("/reports/{id}/resolve")
    public Map<String, Object> resolve(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody RiskResolveRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireSuperAdmin(authorization);
        return riskReportService.resolve(id, request, context.userId());
    }
}
