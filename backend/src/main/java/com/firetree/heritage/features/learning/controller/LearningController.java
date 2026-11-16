package com.firetree.heritage.features.learning.controller;

import com.firetree.heritage.features.learning.dto.LearningCheckinRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.learning.service.LearningService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService learningService;
    private final AccessControlService accessControlService;

    public LearningController(LearningService learningService, AccessControlService accessControlService) {
        this.learningService = learningService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/recommendations/daily")
    public Map<String, Object> dailyRecommendation(@RequestParam(required = false) String date) {
        return learningService.dailyRecommendation(date);
    }

    @PostMapping("/recommendations/generate")
    public Map<String, Object> generateRecommendation(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) String date,
        @RequestParam(defaultValue = "6") int limit
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return learningService.generateRecommendation(date, limit);
    }

    @GetMapping("/hot")
    public Map<String, Object> hotNodes(@RequestParam(defaultValue = "10") int limit) {
        return learningService.hotNodes(limit);
    }

    @GetMapping("/checkins")
    public Map<String, Object> checkins(
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String username,
        @RequestParam String month
    ) {
        return learningService.checkins(learningService.resolveUserId(userId, username), month);
    }

    @PostMapping("/checkins")
    public Map<String, Object> checkin(@Valid @RequestBody LearningCheckinRequest request) {
        return learningService.checkin(request);
    }
}
