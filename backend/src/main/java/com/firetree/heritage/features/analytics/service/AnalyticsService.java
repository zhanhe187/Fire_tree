package com.firetree.heritage.features.analytics.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.analytics.mapper.AnalyticsMapper;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final AnalyticsMapper mapper;

    public AnalyticsService(AnalyticsMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> overview() {
        return mapper.overview();
    }

    public Map<String, Object> searchHot(int limit) {
        return mapper.searchHot(limit);
    }

    public Map<String, Object> behaviorTrend(int days) {
        return mapper.behaviorTrend(days);
    }

    public Map<String, Object> operationAudit(String keyword, int page, int size) {
        return mapper.operationAudit(keyword, page, size);
    }
}
