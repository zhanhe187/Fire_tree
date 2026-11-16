package com.firetree.heritage.features.system.controller;

import com.firetree.heritage.features.system.service.ProjectMetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ProjectMetricsService metricsService;

    public DashboardController(ProjectMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return metricsService.dashboardSummary();
    }
}

