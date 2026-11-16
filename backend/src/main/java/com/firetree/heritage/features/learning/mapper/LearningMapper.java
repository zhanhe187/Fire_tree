package com.firetree.heritage.features.learning.mapper;

import com.firetree.heritage.features.learning.dto.LearningCheckinRequest;
import com.firetree.heritage.features.learning.service.AiRecommendationService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
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
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;

@Component
public class LearningMapper {

    private static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");

    private final MybatisSqlExecutor sqlExecutor;
    private final UserLookupMapper userLookupMapper;
    private final AiRecommendationService aiRecommendationService;

    public LearningMapper(MybatisSqlExecutor sqlExecutor, UserLookupMapper userLookupMapper, AiRecommendationService aiRecommendationService) {
        this.sqlExecutor = sqlExecutor;
        this.userLookupMapper = userLookupMapper;
        this.aiRecommendationService = aiRecommendationService;
    }

    public Map<String, Object> dailyRecommendation(String rawDate) {
        LocalDate date = parseDateOrToday(rawDate);
        if (!recommendationExists(date)) {
            return generateRecommendation(date, 6);
        }
        return recommendation(date);
    }

    @Transactional
    public Map<String, Object> generateRecommendation(String rawDate, int limit) {
        return generateRecommendation(parseDateOrToday(rawDate), limit);
    }

    @Transactional
    public Map<String, Object> generateRecommendation(LocalDate date, int limit) {
        if (recommendationExists(date)) {
            return recommendation(date);
        }

        long recommendationId = insertRecommendation(date);
        List<Map<String, Object>> candidates = recommendationCandidates(Math.max(limit * 3, limit));
        List<AiRecommendationService.RecommendationChoice> aiChoices = aiRecommendationService.createChoices(date, candidates, safeLimit(limit));
        int sortOrder = 1;
        if (!aiChoices.isEmpty()) {
            Map<Long, Map<String, Object>> candidatesById = new LinkedHashMap<>();
            for (Map<String, Object> candidate : candidates) {
                candidatesById.put(((Number) candidate.get("id")).longValue(), candidate);
            }
            for (AiRecommendationService.RecommendationChoice choice : aiChoices) {
                if (!candidatesById.containsKey(choice.nodeId())) {
                    continue;
                }
                sqlExecutor.update("""
                    insert into daily_recommendation_items (recommendation_id, node_id, reason, sort_order)
                    values (?, ?, ?, ?)
                    """,
                    recommendationId,
                    choice.nodeId(),
                    choice.reason(),
                    sortOrder++
                );
            }
        }
        for (Map<String, Object> candidate : candidates) {
            if (sortOrder > safeLimit(limit)) {
                break;
            }
            long nodeId = ((Number) candidate.get("id")).longValue();
            Integer existing = sqlExecutor.queryForObject("""
                select count(*)
                from daily_recommendation_items
                where recommendation_id = ? and node_id = ?
                """, Integer.class, recommendationId, nodeId);
            if (existing != null && existing > 0) {
                continue;
            }
            sqlExecutor.update("""
                insert into daily_recommendation_items (recommendation_id, node_id, reason, sort_order)
                values (?, ?, ?, ?)
                """,
                recommendationId,
                nodeId,
                reason(candidate),
                sortOrder++
            );
        }
        return recommendation(date);
    }

    public Map<String, Object> hotNodes(int limit) {
        int safeLimit = safeLimit(limit);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              coalesce(nullif(n.alias, ''), n.name) as nodeName,
              nt.type_name as nodeTypeName,
              n.summary,
              n.province,
              n.popularity_count as popularityCount,
              coalesce(f.favoriteCount, 0) as favoriteCount,
              coalesce(r.recommendCount, 0) as recommendCount,
              (n.popularity_count + coalesce(f.favoriteCount, 0) * 5 + coalesce(r.recommendCount, 0) * 3) as hotScore
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            left join (
              select node_id, count(*) as favoriteCount
              from favorite_nodes
              group by node_id
            ) f on f.node_id = n.id
            left join (
              select node_id, count(*) as recommendCount
              from daily_recommendation_items
              group by node_id
            ) r on r.node_id = n.id
            where n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
            order by hotScore desc, n.updated_at desc, n.id desc
            limit ?
            """, safeLimit);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", items.size());
        result.put("items", items);
        return result;
    }

    @Transactional
    public Map<String, Object> checkin(LearningCheckinRequest request) {
        long userId = userLookupMapper.resolveUserId(request.userId(), request.username(), "username");
        LocalDate date = parseDateOrToday(request.date());
        // 不允许给未来日期打卡：前端日期选择器可以被改成明天
        if (date.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checkin date cannot be in the future");
        }
        long recommendationId = ((Number) dailyRecommendation(date.toString()).get("id")).longValue();
        int continuousDays = previousContinuousDays(userId, date) + 1;

        try {
            sqlExecutor.update("""
                insert into learning_checkins (user_id, checkin_date, recommendation_id, continuous_days)
                values (?, ?, ?, ?)
                """, userId, Date.valueOf(date), recommendationId, continuousDays);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already checked in today");
        }

        return checkinByUserAndDate(userId, date);
    }

    public Map<String, Object> checkins(long userId, String rawMonth) {
        userLookupMapper.ensureUserExists(userId, "userId is invalid");
        YearMonth month = parseMonth(rawMonth);
        LocalDate start = month.atDay(1);
        LocalDate end = month.plusMonths(1).atDay(1);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              c.id,
              c.user_id as userId,
              date_format(c.checkin_date, '%Y-%m-%d') as checkinDate,
              c.recommendation_id as recommendationId,
              c.continuous_days as continuousDays,
              c.created_at as createdAt
            from learning_checkins c
            where c.user_id = ?
              and c.checkin_date >= ?
              and c.checkin_date < ?
            order by c.checkin_date, c.id
            """, userId, Date.valueOf(start), Date.valueOf(end));

        int currentStreak = items.isEmpty()
            ? 0
            : ((Number) items.get(items.size() - 1).get("continuousDays")).intValue();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", userId);
        result.put("month", month.toString());
        result.put("total", items.size());
        result.put("currentStreak", currentStreak);
        result.put("items", items);
        return result;
    }

    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Shanghai")
    public void generateTodayRecommendation() {
        generateRecommendation(LocalDate.now(CHINA_ZONE), 6);
    }

    private long insertRecommendation(LocalDate date) {
        try {
            return sqlExecutor.insertAndReturnKey("""
                insert into daily_recommendations (recommend_date, title, rule_snapshot)
                values (?, ?, ?)
                """,
                Date.valueOf(date),
                "\u6bcf\u65e5\u63a8\u8350 " + date,
                "{\"order\":\"popularity\",\"limit\":6}"
            );
        } catch (DataIntegrityViolationException exception) {
            return recommendationId(date);
        }
    }
    private List<Map<String, Object>> recommendationCandidates(int limit) {
        return sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              coalesce(nullif(n.alias, ''), n.name) as nodeName,
              nt.type_name as nodeTypeName,
              n.province,
              n.popularity_count as popularityCount
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
              and n.node_code not like 'test_%'
              and n.node_code not like 'exhibition_%'
            order by n.popularity_count desc, n.updated_at desc, n.id desc
            limit ?
            """, safeLimit(limit));
    }

    private Map<String, Object> recommendation(LocalDate date) {
        Map<String, Object> recommendation;
        try {
            recommendation = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  id,
                  date_format(recommend_date, '%Y-%m-%d') as recommendDate,
                  title,
                  rule_snapshot as ruleSnapshot,
                  created_at as createdAt
                from daily_recommendations
                where recommend_date = ?
                """, Date.valueOf(date)));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recommendation not found");
        }

        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              i.id,
              i.node_id as nodeId,
              n.node_code as nodeCode,
              coalesce(nullif(n.alias, ''), n.name) as nodeName,
              nt.type_name as nodeTypeName,
              n.summary,
              n.province,
              n.popularity_count as popularityCount,
              i.reason,
              i.sort_order as sortOrder
            from daily_recommendation_items i
            join graph_nodes n on n.id = i.node_id
            join graph_node_types nt on nt.id = n.node_type_id
            where i.recommendation_id = ?
            order by i.sort_order, i.id
            """, recommendation.get("id"));
        recommendation.put("total", items.size());
        recommendation.put("items", items);
        return recommendation;
    }

    private Map<String, Object> checkinByUserAndDate(long userId, LocalDate date) {
        return sqlExecutor.queryForMap("""
            select
              id,
              user_id as userId,
              date_format(checkin_date, '%Y-%m-%d') as checkinDate,
              recommendation_id as recommendationId,
              continuous_days as continuousDays,
              created_at as createdAt
            from learning_checkins
            where user_id = ? and checkin_date = ?
            """, userId, Date.valueOf(date));
    }

    private int previousContinuousDays(long userId, LocalDate date) {
        try {
            Integer days = sqlExecutor.queryForObject("""
                select continuous_days
                from learning_checkins
                where user_id = ? and checkin_date = ?
                """, Integer.class, userId, Date.valueOf(date.minusDays(1)));
            return days == null ? 0 : days;
        } catch (EmptyResultDataAccessException exception) {
            return 0;
        }
    }

    private boolean recommendationExists(LocalDate date) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from daily_recommendations where recommend_date = ?",
            Integer.class,
            Date.valueOf(date)
        );
        return count != null && count > 0;
    }

    private long recommendationId(LocalDate date) {
        return sqlExecutor.queryForObject(
            "select id from daily_recommendations where recommend_date = ?",
            Long.class,
            Date.valueOf(date)
        );
    }

    private LocalDate parseDateOrToday(String value) {
        if (value == null || value.isBlank()) {
            return LocalDate.now(CHINA_ZONE);
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date must be yyyy-MM-dd");
        }
    }

    private YearMonth parseMonth(String value) {
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be yyyy-MM");
        }
    }

    private int safeLimit(int limit) {
        return Math.min(Math.max(limit, 1), 20);
    }

    private String reason(Map<String, Object> candidate) {
        return "\u70ed\u5ea6 " + candidate.get("popularityCount") + "\uff0c\u9002\u5408\u4eca\u65e5\u5b66\u4e60";
    }
}
