package com.firetree.heritage.features.governance.service;

import com.firetree.heritage.features.governance.dto.RiskResolveRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.governance.mapper.RiskReportMapper;
import org.springframework.stereotype.Service;

@Service
public class RiskReportService {

    private final RiskReportMapper mapper;

    public RiskReportService(RiskReportMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> scan() {
        return mapper.scan();
    }

    public Map<String, Object> reports(String keyword, String severity, String status, int page, int size) {
        return mapper.reports(keyword, severity, status, page, size);
    }

    public Map<String, Object> resolve(long id, RiskResolveRequest request, long resolverId) {
        return mapper.resolve(id, request, resolverId);
    }
}
