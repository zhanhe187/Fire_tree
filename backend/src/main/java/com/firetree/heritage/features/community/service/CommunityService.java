package com.firetree.heritage.features.community.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.community.dto.CommunityAnswerRequest;
import com.firetree.heritage.features.community.dto.CommunityCommentRequest;
import com.firetree.heritage.features.community.dto.CommunityLikeRequest;
import com.firetree.heritage.features.community.dto.CommunityQuestionRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.firetree.heritage.features.community.mapper.CommunityMapper;
import org.springframework.stereotype.Service;

@Service
public class CommunityService {

    private final CommunityMapper mapper;

    public CommunityService(CommunityMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchQuestions(String keyword, Long nodeId, Long authorId, int page, int size, long currentUserId) {
        return mapper.searchQuestions(keyword, nodeId, authorId, page, size, currentUserId);
    }

    public Map<String, Object> getQuestion(long id, long currentUserId) {
        return mapper.getQuestion(id, currentUserId);
    }

    public Map<String, Object> countRepliesSince(long questionId, String since) {
        return mapper.countRepliesSince(questionId, since);
    }

    public Map<String, Object> createQuestion(CommunityQuestionRequest request, long currentUserId) {
        return mapper.createQuestion(request, currentUserId);
    }

    public Map<String, Object> createAnswer(long questionId, CommunityAnswerRequest request, long currentUserId) {
        return mapper.createAnswer(questionId, request, currentUserId);
    }

    public Map<String, Object> createComment(String targetType, long targetId, CommunityCommentRequest request, long currentUserId) {
        return mapper.createComment(targetType, targetId, request, currentUserId);
    }

    public Map<String, Object> likeTarget(String targetType, long targetId, CommunityLikeRequest request, long currentUserId) {
        return mapper.likeTarget(targetType, targetId, request, currentUserId);
    }

    public void deleteQuestion(long id, Map<String, Object> authPayload) {
        mapper.deleteQuestion(id, authPayload);
    }
}
