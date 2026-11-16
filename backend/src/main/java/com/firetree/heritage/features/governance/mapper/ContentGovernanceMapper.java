package com.firetree.heritage.features.governance.mapper;

import com.firetree.heritage.features.governance.dto.SensitiveWordRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class ContentGovernanceMapper {

    private final MybatisSqlExecutor sqlExecutor;

    public ContentGovernanceMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> searchSensitiveWords(String keyword, String wordType, Integer status, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = "sw.deleted = 0";
        if (keyword != null && !keyword.isBlank()) {
            where += " and word like ?";
            params.add("%" + keyword.trim() + "%");
        }
        if (wordType != null && !wordType.isBlank()) {
            where += " and word_type = ?";
            params.add(normalizeType(wordType));
        }
        if (status != null) {
            where += " and status = ?";
            params.add(status == 0 ? 0 : 1);
        }

        Integer total = sqlExecutor.queryForObject(
            "select count(*) from sensitive_words sw where " + where,
            Integer.class,
            params.toArray()
        );
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              sw.id,
              sw.word,
              sw.word_type as wordType,
              sw.severity,
              sw.status,
              sw.created_by as createdBy,
              u.username as creatorUsername,
              u.nickname as creatorName,
              sw.created_at as createdAt,
              sw.updated_at as updatedAt
            from sensitive_words sw
            left join sys_users u on u.id = sw.created_by
            where %s
            order by sw.updated_at desc, sw.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> createSensitiveWord(SensitiveWordRequest request, long operatorId) {
        String word = normalizeWord(request.word());
        String wordType = normalizeType(request.wordType());
        int severity = normalizeSeverity(request.severity());
        int status = request.status() == null ? 1 : (request.status() == 0 ? 0 : 1);
        try {
            long id = sqlExecutor.insertAndReturnKey("""
                insert into sensitive_words (word, word_type, severity, status, created_by)
                values (?, ?, ?, ?, ?)
                """, word, wordType, severity, status, operatorId);
            return getSensitiveWord(id);
        } catch (DuplicateKeyException exception) {
            // Purge ghost soft-deleted row that may still occupy the unique key, then retry once
            sqlExecutor.update("delete from sensitive_words where word = ? and deleted = 1", word);
            try {
                long id = sqlExecutor.insertAndReturnKey("""
                    insert into sensitive_words (word, word_type, severity, status, created_by)
                    values (?, ?, ?, ?, ?)
                    """, word, wordType, severity, status, operatorId);
                return getSensitiveWord(id);
            } catch (DuplicateKeyException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Sensitive word already exists");
            }
        }
    }

    public Map<String, Object> updateSensitiveWord(long id, SensitiveWordRequest request) {
        ensureSensitiveWordExists(id);
        sqlExecutor.update("""
            update sensitive_words
            set word = ?, word_type = ?, severity = ?, status = ?
            where id = ? and deleted = 0
            """,
            normalizeWord(request.word()),
            normalizeType(request.wordType()),
            normalizeSeverity(request.severity()),
            request.status() == null ? 1 : (request.status() == 0 ? 0 : 1),
            id
        );
        return getSensitiveWord(id);
    }

    public void deleteSensitiveWord(long id) {
        ensureSensitiveWordExists(id);
        // Physical delete to prevent ghost rows from blocking unique-key re-creation
        sqlExecutor.update("delete from sensitive_words where id = ?", id);
    }

    public Map<String, Object> searchReviewRecords(String keyword, String contentType, String status, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = "1 = 1";
        if (keyword != null && !keyword.isBlank()) {
            where += " and (raw_content like ? or matched_words like ?)";
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
        }
        if (contentType != null && !contentType.isBlank()) {
            where += " and content_type = ?";
            params.add(contentType.trim().toUpperCase(Locale.ROOT));
        }
        if (status != null && !status.isBlank()) {
            where += " and status = ?";
            params.add(status.trim().toUpperCase(Locale.ROOT));
        }
        Integer total = sqlExecutor.queryForObject(
            "select count(*) from content_review_records where " + where,
            Integer.class,
            params.toArray()
        );
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              id,
              content_type as contentType,
              content_id as contentId,
              raw_content as rawContent,
              matched_words as matchedWords,
              status,
              created_at as createdAt
            from content_review_records
            where %s
            order by created_at desc, id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    private Map<String, Object> getSensitiveWord(long id) {
        return sqlExecutor.queryForMap("""
            select
              sw.id,
              sw.word,
              sw.word_type as wordType,
              sw.severity,
              sw.status,
              sw.created_by as createdBy,
              u.username as creatorUsername,
              u.nickname as creatorName,
              sw.created_at as createdAt,
              sw.updated_at as updatedAt
            from sensitive_words sw
            left join sys_users u on u.id = sw.created_by
            where sw.id = ? and sw.deleted = 0
            """, id);
    }

    private void ensureSensitiveWordExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from sensitive_words where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensitive word not found");
        }
    }

    private String normalizeWord(String word) {
        String normalized = word == null ? "" : word.trim();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensitive word is required");
        }
        return normalized;
    }

    private String normalizeType(String wordType) {
        if (wordType == null || wordType.isBlank()) {
            return "GENERAL";
        }
        return wordType.trim().toUpperCase(Locale.ROOT);
    }

    private int normalizeSeverity(Integer severity) {
        if (severity == null) {
            return 1;
        }
        return Math.min(3, Math.max(1, severity));
    }
}
