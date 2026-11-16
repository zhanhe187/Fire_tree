package com.firetree.heritage.features.learning.service;

import com.firetree.heritage.features.learning.dto.LearningCheckinRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Date;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.learning.mapper.LearningMapper;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;
import org.springframework.stereotype.Service;

@Service
public class LearningService {

    private final LearningMapper mapper;
    private final UserLookupMapper userLookupMapper;

    public LearningService(LearningMapper mapper, UserLookupMapper userLookupMapper) {
        this.mapper = mapper;
        this.userLookupMapper = userLookupMapper;
    }

    public long resolveUserId(Long userId, String username) {
        return userLookupMapper.resolveUserId(userId, username, "username");
    }

    public Map<String, Object> dailyRecommendation(String rawDate) {
        return mapper.dailyRecommendation(rawDate);
    }

    public Map<String, Object> generateRecommendation(String rawDate, int limit) {
        return mapper.generateRecommendation(rawDate, limit);
    }

    public Map<String, Object> generateRecommendation(LocalDate date, int limit) {
        return mapper.generateRecommendation(date, limit);
    }

    public Map<String, Object> hotNodes(int limit) {
        return mapper.hotNodes(limit);
    }

    public Map<String, Object> checkin(LearningCheckinRequest request) {
        return mapper.checkin(request);
    }

    public Map<String, Object> checkins(long userId, String rawMonth) {
        return mapper.checkins(userId, rawMonth);
    }

    public void generateTodayRecommendation() {
        mapper.generateTodayRecommendation();
    }
}
