package com.firetree.heritage.features.community.controller;

import com.firetree.heritage.features.community.dto.CommunityAnswerRequest;
import com.firetree.heritage.features.community.dto.CommunityCommentRequest;
import com.firetree.heritage.features.community.dto.CommunityLikeRequest;
import com.firetree.heritage.features.community.dto.CommunityQuestionRequest;
import com.firetree.heritage.features.auth.service.AuthService;
import com.firetree.heritage.features.community.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityService communityService;
    private final AuthService authService;

    public CommunityController(CommunityService communityService, AuthService authService) {
        this.communityService = communityService;
        this.authService = authService;
    }

    @GetMapping("/questions")
    public Map<String, Object> questions(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long nodeId,
        @RequestParam(required = false) Long authorId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return communityService.searchQuestions(keyword, nodeId, authorId, page, size, resolveViewerId(authorization));
    }

    @GetMapping("/questions/{id}")
    public Map<String, Object> question(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return communityService.getQuestion(id, resolveViewerId(authorization));
    }

    @GetMapping("/questions/{id}/replies-since")
    public Map<String, Object> repliesSince(
        @PathVariable long id,
        @RequestParam String since
    ) {
        return communityService.countRepliesSince(id, since);
    }

    private long resolveViewerId(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return 0;
        }
        return authService.requireUserId(authorization);
    }

    @PostMapping("/questions")
    public Map<String, Object> createQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CommunityQuestionRequest request
    ) {
        return communityService.createQuestion(request, authService.requireUserId(authorization));
    }

    @PostMapping("/questions/{id}/answers")
    public Map<String, Object> createAnswer(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CommunityAnswerRequest request
    ) {
        return communityService.createAnswer(id, request, authService.requireUserId(authorization));
    }

    @PostMapping("/answers/{id}/comments")
    public Map<String, Object> createAnswerComment(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CommunityCommentRequest request
    ) {
        return communityService.createComment("ANSWER", id, request, authService.requireUserId(authorization));
    }

    @PostMapping("/questions/{id}/comments")
    public Map<String, Object> createQuestionComment(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CommunityCommentRequest request
    ) {
        return communityService.createComment("QUESTION", id, request, authService.requireUserId(authorization));
    }

    @PostMapping("/questions/{id}/likes")
    public Map<String, Object> likeQuestion(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CommunityLikeRequest request
    ) {
        return communityService.likeTarget("QUESTION", id, request, authService.requireUserId(authorization));
    }

    @DeleteMapping("/questions/{id}")
    public void deleteQuestion(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        communityService.deleteQuestion(id, authService.requireCurrentUser(authorization));
    }
}
