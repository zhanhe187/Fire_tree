package com.firetree.heritage.features.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.application.dto.ApplicationRequest;
import com.firetree.heritage.features.application.dto.ReviewDecisionRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.application.mapper.ApplicationReviewMapper;
import org.springframework.stereotype.Service;

@Service
public class ApplicationReviewService {

    private final ApplicationReviewMapper mapper;

    public ApplicationReviewService(ApplicationReviewMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchApplications(String keyword, String status, String applicationType, int page, int size) {
        return mapper.searchApplications(keyword, status, applicationType, page, size);
    }

    public Map<String, Object> searchApplicationsForUser(long userId, String keyword, String status, String applicationType, int page, int size) {
        return mapper.searchApplicationsForUser(userId, keyword, status, applicationType, page, size);
    }

    public Map<String, Object> getApplication(long id) {
        return mapper.getApplication(id);
    }

    public Map<String, Object> getApplicationForUser(long id, long userId) {
        return mapper.getApplicationForUser(id, userId);
    }

    public Map<String, Object> createApplication(ApplicationRequest request) {
        return mapper.createApplication(request);
    }

    public Map<String, Object> createApplicationForUser(ApplicationRequest request, long userId) {
        return mapper.createApplicationForUser(request, userId);
    }

    public Map<String, Object> updateApplication(long id, ApplicationRequest request) {
        return mapper.updateApplication(id, request);
    }

    public Map<String, Object> updateApplicationForUser(long id, ApplicationRequest request, long userId) {
        return mapper.updateApplicationForUser(id, request, userId);
    }

    public void deleteApplication(long id) {
        mapper.deleteApplication(id);
    }

    public void deleteApplicationForUser(long id, long userId) {
        mapper.deleteApplicationForUser(id, userId);
    }

    public Map<String, Object> submitApplication(long id) {
        return mapper.submitApplication(id);
    }

    public Map<String, Object> submitApplicationForUser(long id, long userId) {
        return mapper.submitApplicationForUser(id, userId);
    }

    public Map<String, Object> reviewApplication(long id, String decision, ReviewDecisionRequest request, long fallbackReviewerId) {
        return mapper.reviewApplication(id, decision, request, fallbackReviewerId);
    }
}
