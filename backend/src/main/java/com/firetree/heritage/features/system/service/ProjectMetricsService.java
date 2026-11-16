package com.firetree.heritage.features.system.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.ProjectMetricsMapper;
import org.springframework.stereotype.Service;

@Service
public class ProjectMetricsService {

    private final ProjectMetricsMapper mapper;

    public ProjectMetricsService(ProjectMetricsMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> graphOverview() {
        return mapper.graphOverview();
    }

    public Map<String, Object> dashboardSummary() {
        return mapper.dashboardSummary();
    }
}
