package com.firetree.heritage.features.community.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.community.dto.CommunityAnswerRequest;
import com.firetree.heritage.features.community.dto.CommunityCommentRequest;
import com.firetree.heritage.features.community.dto.CommunityLikeRequest;
import com.firetree.heritage.features.community.dto.CommunityQuestionRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class CommunityMapper {

    private final MybatisSqlExecutor sqlExecutor;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate reviewRecordTransaction;

    public CommunityMapper(MybatisSqlExecutor sqlExecutor, ObjectMapper objectMapper, PlatformTransactionManager transactionManager) {
        this.sqlExecutor = sqlExecutor;
        this.objectMapper = objectMapper;
        this.reviewRecordTransaction = new TransactionTemplate(transactionManager);
        this.reviewRecordTransaction.setPropagationBehaviorName("PROPAGATION_REQUIRES_NEW");
    }

    public Map<String, Object> searchQuestions(String keyword, Long nodeId, Long authorId, int page, int size, long currentUserId) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildQuestionWhere(keyword, nodeId, authorId, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from community_questions q
            join sys_users u on u.id = q.author_id
            left join graph_nodes n on n.id = q.node_id and n.deleted = 0
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add(0, currentUserId);
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              q.id,
              q.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              q.author_id as authorId,
              u.nickname as authorName,
              u.avatar_url as authorAvatar,
              q.title,
              q.content,
              q.image_url as imageUrl,
              q.answer_count as answerCount,
              q.view_count as viewCount,
              q.like_count as likeCount,
              case when exists (
                select 1 from community_likes l
                where l.target_type = 'QUESTION' and l.target_id = q.id and l.user_id = ?
              ) then 1 else 0 end as liked,
              q.status,
              q.created_at as createdAt,
              q.updated_at as updatedAt
            from community_questions q
            join sys_users u on u.id = q.author_id
            left join graph_nodes n on n.id = q.node_id and n.deleted = 0
            where %s
            order by q.updated_at desc, q.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> countRepliesSince(long questionId, String since) {
        long answerCount = sqlExecutor.queryForObject("""
            select count(*)
            from community_answers
            where question_id = ? and deleted = 0 and created_at > ?
            """, Long.class, questionId, since);
        long commentCount = sqlExecutor.queryForObject("""
            select count(*)
            from community_comments c
            left join community_answers a on a.id = c.target_id and c.target_type = 'ANSWER'
            where c.deleted = 0
              and c.created_at > ?
              and (
                (c.target_type = 'QUESTION' and c.target_id = ?)
                or (c.target_type = 'ANSWER' and a.question_id = ?)
              )
            """, Long.class, since, questionId, questionId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("questionId", questionId);
        result.put("newAnswerCount", answerCount);
        result.put("newCommentCount", commentCount);
        result.put("totalNewReplyCount", answerCount + commentCount);
        return result;
    }

    @Transactional
    public Map<String, Object> getQuestion(long id, long currentUserId) {
        sqlExecutor.update("update community_questions set view_count = view_count + 1 where id = ? and deleted = 0", id);
        Map<String, Object> question;
        try {
            question = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  q.id,
                  q.node_id as nodeId,
                  n.node_code as nodeCode,
                  n.name as nodeName,
                  q.author_id as authorId,
                  u.nickname as authorName,
                  u.avatar_url as authorAvatar,
                  q.title,
                  q.content,
                  q.image_url as imageUrl,
                  q.answer_count as answerCount,
                  q.view_count as viewCount,
                  q.like_count as likeCount,
                  case when exists (
                    select 1 from community_likes l
                    where l.target_type = 'QUESTION' and l.target_id = q.id and l.user_id = ?
                  ) then 1 else 0 end as liked,
                  q.status,
                  q.created_at as createdAt,
                  q.updated_at as updatedAt
                from community_questions q
                join sys_users u on u.id = q.author_id
                left join graph_nodes n on n.id = q.node_id and n.deleted = 0
                where q.id = ? and q.deleted = 0 and q.status <> 'DELETED'
                """, currentUserId, id));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found");
        }

        question.put("answers", answers(id, currentUserId));
        question.put("comments", commentsForQuestionThread(id));
        question.put("relatedInheritors", relatedInheritors((Number) question.get("nodeId")));
        return question;
    }

    @Transactional
    public Map<String, Object> createQuestion(CommunityQuestionRequest request, long currentUserId) {
        requireText(request.title(), "title is required");
        requireText(request.content(), "content is required");
        ensureUserExists(currentUserId, "current user is invalid");
        if (request.nodeId() != null) {
            ensureNodeExists(request.nodeId());
        }
        moderate("QUESTION", request.title() + "\n" + request.content());

        long id = sqlExecutor.insertAndReturnKey("""
            insert into community_questions (node_id, author_id, title, content, image_url, status)
            values (?, ?, ?, ?, ?, 'PUBLISHED')
            """,
            request.nodeId(),
            currentUserId,
            request.title(),
            request.content(),
            blankToNull(request.imageUrl())
        );
        return getQuestion(id, currentUserId);
    }

    @Transactional
    public Map<String, Object> createAnswer(long questionId, CommunityAnswerRequest request, long currentUserId) {
        ensureQuestionExists(questionId);
        requireText(request.content(), "content is required");
        ensureUserExists(currentUserId, "current user is invalid");
        moderate("ANSWER", request.content());

        long id = sqlExecutor.insertAndReturnKey("""
            insert into community_answers (question_id, author_id, content, status)
            values (?, ?, ?, 'PUBLISHED')
            """,
            questionId,
            currentUserId,
            request.content()
        );
        sqlExecutor.update("update community_questions set answer_count = answer_count + 1 where id = ?", questionId);

        return answer(id);
    }

    @Transactional
    public Map<String, Object> createComment(String targetType, long targetId, CommunityCommentRequest request, long currentUserId) {
        String normalizedTarget = normalizeCommentTarget(targetType);
        ensureCommentTargetExists(normalizedTarget, targetId);
        requireText(request.content(), "content is required");
        ensureUserExists(currentUserId, "current user is invalid");
        moderate("COMMENT", request.content());

        long id = sqlExecutor.insertAndReturnKey("""
            insert into community_comments (target_type, target_id, author_id, content, status)
            values (?, ?, ?, ?, 'PUBLISHED')
            """,
            normalizedTarget,
            targetId,
            currentUserId,
            request.content()
        );
        return comment(id);
    }

    @Transactional
    public Map<String, Object> likeTarget(String targetType, long targetId, CommunityLikeRequest request, long currentUserId) {
        String normalizedTarget = normalizeLikeTarget(targetType);
        ensureLikeTargetExists(normalizedTarget, targetId);
        ensureUserExists(currentUserId, "current user is invalid");

        Integer existing = sqlExecutor.queryForObject("""
            select count(*)
            from community_likes
            where target_type = ? and target_id = ? and user_id = ?
            """, Integer.class, normalizedTarget, targetId, currentUserId);
        boolean alreadyLiked = existing != null && existing > 0;

        if (alreadyLiked) {
            sqlExecutor.update("""
                delete from community_likes
                where target_type = ? and target_id = ? and user_id = ?
                """, normalizedTarget, targetId, currentUserId);
        } else {
            sqlExecutor.update("""
                insert into community_likes (target_type, target_id, user_id)
                values (?, ?, ?)
                """, normalizedTarget, targetId, currentUserId);
        }

        int delta = alreadyLiked ? -1 : 1;
        if ("QUESTION".equals(normalizedTarget)) {
            sqlExecutor.update("update community_questions set like_count = greatest(like_count + ?, 0) where id = ?", delta, targetId);
        } else if ("ANSWER".equals(normalizedTarget)) {
            sqlExecutor.update("update community_answers set like_count = greatest(like_count + ?, 0) where id = ?", delta, targetId);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("targetType", normalizedTarget);
        result.put("targetId", targetId);
        result.put("liked", !alreadyLiked);
        result.put("likeCount", likeCount(normalizedTarget, targetId));
        return result;
    }

    @Transactional
    public void deleteQuestion(long id, Map<String, Object> authPayload) {
        Map<?, ?> user = (Map<?, ?>) authPayload.get("user");
        List<?> roles = (List<?>) authPayload.get("roles");
        long currentUserId = ((Number) user.get("id")).longValue();
        boolean isAdmin = roles.stream()
            .map(role -> String.valueOf(((Map<?, ?>) role).get("roleCode")))
            .anyMatch("SUPER_ADMIN"::equals);
        Map<String, Object> question = getQuestion(id, 0);
        long authorId = ((Number) question.get("authorId")).longValue();
        if (!isAdmin && authorId != currentUserId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author or admin can delete this question");
        }
        // Soft delete keeps the audit trail; all read paths filter deleted = 0.
        sqlExecutor.update("update community_comments set deleted = 1 where target_type = 'QUESTION' and target_id = ?", id);
        sqlExecutor.update("""
            update community_comments
            set deleted = 1
            where target_type = 'ANSWER'
              and target_id in (select id from (select id from community_answers where question_id = ?) t)
            """, id);
        sqlExecutor.update("update community_answers set deleted = 1, status = 'DELETED' where question_id = ?", id);
        sqlExecutor.update("update community_questions set deleted = 1, status = 'DELETED' where id = ?", id);
    }

    private List<Map<String, Object>> answers(long questionId, long currentUserId) {
        return sqlExecutor.queryForList("""
            select
              a.id,
              a.question_id as questionId,
              a.author_id as authorId,
              u.nickname as authorName,
              u.avatar_url as authorAvatar,
              a.content,
              a.accepted,
              a.like_count as likeCount,
              case when exists (
                select 1 from community_likes l
                where l.target_type = 'ANSWER' and l.target_id = a.id and l.user_id = ?
              ) then 1 else 0 end as liked,
              a.status,
              a.created_at as createdAt,
              a.updated_at as updatedAt
            from community_answers a
            join sys_users u on u.id = a.author_id
            where a.question_id = ? and a.deleted = 0 and a.status = 'PUBLISHED'
            order by a.accepted desc, a.created_at, a.id
            """, currentUserId, questionId);
    }

    private Map<String, Object> answer(long answerId) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  a.id,
                  a.question_id as questionId,
                  a.author_id as authorId,
                  u.nickname as authorName,
                  u.avatar_url as authorAvatar,
                  a.content,
                  a.accepted,
                  a.like_count as likeCount,
                  a.status,
                  a.created_at as createdAt,
                  a.updated_at as updatedAt
                from community_answers a
                join sys_users u on u.id = a.author_id
                where a.id = ? and a.deleted = 0
                """, answerId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Answer not found");
        }
    }

    private Map<String, Object> comment(long commentId) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  c.id,
                  c.target_type as targetType,
                  c.target_id as targetId,
                  c.author_id as authorId,
                  u.nickname as authorName,
                  c.content,
                  c.status,
                  c.created_at as createdAt,
                  c.updated_at as updatedAt
                from community_comments c
                join sys_users u on u.id = c.author_id
                where c.id = ? and c.deleted = 0
                """, commentId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
    }

    private List<Map<String, Object>> commentsForQuestionThread(long questionId) {
        return sqlExecutor.queryForList("""
            select
              c.id,
              c.target_type as targetType,
              c.target_id as targetId,
              c.author_id as authorId,
              u.nickname as authorName,
              c.content,
              c.status,
              c.created_at as createdAt
            from community_comments c
            join sys_users u on u.id = c.author_id
            left join community_answers a on a.id = c.target_id and c.target_type = 'ANSWER'
            where c.deleted = 0
              and c.status = 'PUBLISHED'
              and (
                (c.target_type = 'QUESTION' and c.target_id = ?)
                or (c.target_type = 'ANSWER' and a.question_id = ?)
              )
            order by c.created_at, c.id
            """, questionId, questionId);
    }

    private List<Map<String, Object>> relatedInheritors(Number nodeId) {
        if (nodeId == null) {
            return List.of();
        }
        return sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id and et.type_code = 'has_inheritor'
            join graph_nodes n on n.id = e.target_node_id and n.deleted = 0
            where e.source_node_id = ? and e.deleted = 0
            order by n.name
            """, nodeId.longValue());
    }

    private String buildQuestionWhere(String keyword, Long nodeId, Long authorId, List<Object> params) {
        StringBuilder where = new StringBuilder("q.deleted = 0 and q.status = 'PUBLISHED'");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (q.title like ? or q.content like ? or u.nickname like ? or n.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (nodeId != null) {
            where.append(" and q.node_id = ?");
            params.add(nodeId);
        }
        if (authorId != null) {
            where.append(" and q.author_id = ?");
            params.add(authorId);
        }
        return where.toString();
    }

    private void moderate(String contentType, String rawContent) {
        List<String> matchedWords = findSensitiveWords(rawContent);
        if (matchedWords.isEmpty()) {
            return;
        }
        reviewRecordTransaction.executeWithoutResult(status -> sqlExecutor.update("""
                insert into content_review_records (content_type, content_id, raw_content, matched_words, status)
                values (?, 0, ?, ?, 'BLOCKED')
                """,
                contentType,
                rawContent,
                toJson(matchedWords)
            )
        );
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content contains sensitive words");
    }

    private List<String> findSensitiveWords(String rawContent) {
        String normalizedContent = rawContent == null ? "" : rawContent.toLowerCase(Locale.ROOT);
        List<String> words = sqlExecutor.queryForList("""
            select word
            from sensitive_words
            where status = 1 and deleted = 0
            """, String.class);
        return words.stream()
            .filter(word -> normalizedContent.contains(word.toLowerCase(Locale.ROOT)))
            .toList();
    }

    private long likeCount(String targetType, long targetId) {
        Long count = sqlExecutor.queryForObject(
            "select count(*) from community_likes where target_type = ? and target_id = ?",
            Long.class,
            targetType,
            targetId
        );
        return count == null ? 0 : count;
    }

    private void ensureQuestionExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from community_questions where id = ? and deleted = 0 and status <> 'DELETED'",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found");
        }
    }

    private void ensureUserExists(long id, String message) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from sys_users where id = ? and deleted = 0 and status = 1",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void ensureNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is invalid");
        }
    }

    private void ensureCommentTargetExists(String targetType, long targetId) {
        if ("QUESTION".equals(targetType)) {
            ensureQuestionExists(targetId);
            return;
        }
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from community_answers where id = ? and deleted = 0 and status <> 'DELETED'",
            Integer.class,
            targetId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Answer not found");
        }
    }

    private void ensureLikeTargetExists(String targetType, long targetId) {
        if ("QUESTION".equals(targetType)) {
            ensureQuestionExists(targetId);
            return;
        }
        ensureCommentTargetExists("ANSWER", targetId);
    }

    private String normalizeCommentTarget(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("QUESTION", "ANSWER").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType is invalid");
        }
        return normalized;
    }

    private String normalizeLikeTarget(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("QUESTION", "ANSWER").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType is invalid");
        }
        return normalized;
    }

    private void requireId(Long value, String message) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content review payload is invalid");
        }
    }
}
