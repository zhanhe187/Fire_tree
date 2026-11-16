package com.firetree.heritage.features.application.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.application.dto.ApplicationRequest;
import com.firetree.heritage.features.application.dto.ReviewDecisionRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;

@Component
public class ApplicationReviewMapper {

    private static final List<String> VALID_TYPES = List.of("PROJECT", "INHERITOR", "MEDIA", "RELATION");
    private static final List<String> VALID_STATUS = List.of("DRAFT", "SUBMITTED", "REJECTED", "APPROVED", "CANCELLED");

    private final MybatisSqlExecutor sqlExecutor;
    private final ObjectMapper objectMapper;
    private final UserLookupMapper userLookupMapper;

    public ApplicationReviewMapper(MybatisSqlExecutor sqlExecutor, ObjectMapper objectMapper, UserLookupMapper userLookupMapper) {
        this.sqlExecutor = sqlExecutor;
        this.objectMapper = objectMapper;
        this.userLookupMapper = userLookupMapper;
    }

    public Map<String, Object> searchApplications(String keyword, String status, String applicationType, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, status, applicationType, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from heritage_applications a
            join sys_users u on u.id = a.applicant_user_id
            left join graph_nodes n on n.id = a.target_node_id and n.deleted = 0
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              a.id,
              a.application_no as applicationNo,
              a.application_type as applicationType,
              a.title,
              a.status,
              a.current_step as currentStep,
              a.review_comment as reviewComment,
              a.submitted_at as submittedAt,
              a.reviewed_at as reviewedAt,
              a.created_at as createdAt,
              a.updated_at as updatedAt,
              u.id as applicantUserId,
              u.nickname as applicantName,
              n.id as targetNodeId,
              n.node_code as targetNodeCode,
              n.name as targetNodeName,
              reviewer.id as reviewerId,
              reviewer.nickname as reviewerName
            from heritage_applications a
            join sys_users u on u.id = a.applicant_user_id
            left join graph_nodes n on n.id = a.target_node_id and n.deleted = 0
            left join sys_users reviewer on reviewer.id = a.reviewer_id
            where %s
            order by a.updated_at desc, a.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> searchApplicationsForUser(long userId, String keyword, String status, String applicationType, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, status, applicationType, userId, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from heritage_applications a
            join sys_users u on u.id = a.applicant_user_id
            left join graph_nodes n on n.id = a.target_node_id and n.deleted = 0
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              a.id,
              a.application_no as applicationNo,
              a.application_type as applicationType,
              a.title,
              a.status,
              a.current_step as currentStep,
              a.review_comment as reviewComment,
              a.submitted_at as submittedAt,
              a.reviewed_at as reviewedAt,
              a.created_at as createdAt,
              a.updated_at as updatedAt,
              u.id as applicantUserId,
              u.nickname as applicantName,
              n.id as targetNodeId,
              n.node_code as targetNodeCode,
              n.name as targetNodeName,
              reviewer.id as reviewerId,
              reviewer.nickname as reviewerName
            from heritage_applications a
            join sys_users u on u.id = a.applicant_user_id
            left join graph_nodes n on n.id = a.target_node_id and n.deleted = 0
            left join sys_users reviewer on reviewer.id = a.reviewer_id
            where %s
            order by a.updated_at desc, a.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getApplication(long id) {
        Map<String, Object> application;
        try {
            application = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  a.id,
                  a.application_no as applicationNo,
                  a.applicant_user_id as applicantUserId,
                  u.nickname as applicantName,
                  a.target_node_id as targetNodeId,
                  n.node_code as targetNodeCode,
                  n.name as targetNodeName,
                  a.application_type as applicationType,
                  a.title,
                  a.form_data as formData,
                  a.status,
                  a.current_step as currentStep,
                  a.review_comment as reviewComment,
                  a.submitted_at as submittedAt,
                  a.reviewed_at as reviewedAt,
                  a.reviewer_id as reviewerId,
                  reviewer.nickname as reviewerName,
                  a.created_at as createdAt,
                  a.updated_at as updatedAt
                from heritage_applications a
                join sys_users u on u.id = a.applicant_user_id
                left join graph_nodes n on n.id = a.target_node_id and n.deleted = 0
                left join sys_users reviewer on reviewer.id = a.reviewer_id
                where a.id = ? and a.deleted = 0
                """, id));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }

        application.put("reviewLogs", reviewLogs(id));
        return application;
    }

    public Map<String, Object> getApplicationForUser(long id, long userId) {
        Map<String, Object> application = getApplication(id);
        long applicantUserId = ((Number) application.get("applicantUserId")).longValue();
        if (applicantUserId != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Application owner permission is required");
        }
        return application;
    }

    @Transactional
    public Map<String, Object> createApplication(ApplicationRequest request) {
        requireText(request.title(), "title is required");
        long applicantUserId = hasUserReference(request.applicantUserId(), request.applicantUsername())
            ? userLookupMapper.resolveUserId(request.applicantUserId(), request.applicantUsername(), "applicantUsername")
            : userLookupMapper.defaultActiveUserId();
        if (request.targetNodeId() != null) {
            ensureNodeExists(request.targetNodeId());
        }

        String applicationNo = request.applicationNo() == null || request.applicationNo().isBlank()
            ? generateApplicationNo()
            : request.applicationNo().trim();
        String applicationType = normalizeType(request.applicationType());
        String formData = toJson(request.formData());
        int currentStep = request.currentStep() == null ? 0 : request.currentStep();

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into heritage_applications (
                  application_no, applicant_user_id, target_node_id, application_type,
                  title, form_data, status, current_step
                ) values (?, ?, ?, ?, ?, ?, 'DRAFT', ?)
                """,
                applicationNo,
                applicantUserId,
                request.targetNodeId(),
                applicationType,
                request.title(),
                formData,
                currentStep
            );
        } catch (DataIntegrityViolationException exception) {
            // Purge ghost soft-deleted row that may still occupy the unique key, then retry once
            sqlExecutor.update("delete from heritage_applications where application_no = ? and deleted = 1", applicationNo);
            try {
                id = sqlExecutor.insertAndReturnKey("""
                    insert into heritage_applications (
                      application_no, applicant_user_id, target_node_id, application_type,
                      title, form_data, status, current_step
                    ) values (?, ?, ?, ?, ?, ?, 'DRAFT', ?)
                    """,
                    applicationNo,
                    applicantUserId,
                    request.targetNodeId(),
                    applicationType,
                    request.title(),
                    formData,
                    currentStep
                );
            } catch (DataIntegrityViolationException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Application number already exists");
            }
        }

        return getApplication(id);
    }

    @Transactional
    public Map<String, Object> createApplicationForUser(ApplicationRequest request, long userId) {
        ApplicationRequest ownedRequest = new ApplicationRequest(
            request.applicationNo(),
            userId,
            null,
            null,
            "PROJECT",
            request.title(),
            request.formData(),
            1
        );
        return createApplication(ownedRequest);
    }

    @Transactional
    public Map<String, Object> updateApplication(long id, ApplicationRequest request) {
        ensureApplicationExists(id);
        requireText(request.title(), "title is required");
        long applicantUserId = hasUserReference(request.applicantUserId(), request.applicantUsername())
            ? userLookupMapper.resolveUserId(request.applicantUserId(), request.applicantUsername(), "applicantUsername")
            : currentApplicantUserId(id);
        if (request.targetNodeId() != null) {
            ensureNodeExists(request.targetNodeId());
        }

        String applicationNo = request.applicationNo() == null || request.applicationNo().isBlank()
            ? currentApplicationNo(id)
            : request.applicationNo().trim();
        String applicationType = normalizeType(request.applicationType());
        String formData = toJson(request.formData());
        int currentStep = request.currentStep() == null ? 0 : request.currentStep();

        try {
            sqlExecutor.update("""
                update heritage_applications
                set application_no = ?,
                    applicant_user_id = ?,
                    target_node_id = ?,
                    application_type = ?,
                    title = ?,
                    form_data = ?,
                    current_step = ?
                where id = ? and deleted = 0
                """,
                applicationNo,
                applicantUserId,
                request.targetNodeId(),
                applicationType,
                request.title().trim(),
                formData,
                currentStep,
                id
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application number already exists");
        }

        return getApplication(id);
    }

    @Transactional
    public Map<String, Object> updateApplicationForUser(long id, ApplicationRequest request, long userId) {
        ensureApplicationOwnedBy(id, userId);
        String currentStatus = currentStatus(id);
        if (!List.of("DRAFT", "REJECTED").contains(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft or rejected applications can be updated");
        }
        ApplicationRequest ownedRequest = new ApplicationRequest(
            request.applicationNo(),
            userId,
            null,
            null,
            "PROJECT",
            request.title(),
            request.formData(),
            1
        );
        return updateApplication(id, ownedRequest);
    }

    @Transactional
    public void deleteApplication(long id) {
        ensureApplicationExists(id);
        // Physical delete to prevent ghost rows from blocking unique-key re-creation
        sqlExecutor.update("delete from heritage_applications where id = ?", id);
    }

    @Transactional
    public void deleteApplicationForUser(long id, long userId) {
        ensureApplicationOwnedBy(id, userId);
        String currentStatus = currentStatus(id);
        if (!List.of("DRAFT", "REJECTED").contains(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft or rejected applications can be cancelled");
        }
        deleteApplication(id);
    }

    @Transactional
    public Map<String, Object> submitApplication(long id) {
        String currentStatus = currentStatus(id);
        if (!List.of("DRAFT", "REJECTED").contains(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft or rejected applications can be submitted");
        }

        sqlExecutor.update("""
            update heritage_applications
            set status = 'SUBMITTED',
                current_step = greatest(current_step, 2),
                submitted_at = current_timestamp,
                review_comment = null,
                reviewer_id = null,
                reviewed_at = null
            where id = ? and deleted = 0
            """, id);
        insertReviewLog(id, currentStatus, "SUBMITTED", "\u63d0\u4ea4\u7533\u62a5", null);
        return getApplication(id);
    }

    @Transactional
    public Map<String, Object> submitApplicationForUser(long id, long userId) {
        ensureApplicationOwnedBy(id, userId);
        return submitApplication(id);
    }

    @Transactional
    public Map<String, Object> reviewApplication(long id, String decision, ReviewDecisionRequest request, long fallbackReviewerId) {
        String targetStatus = normalizeStatus(decision);
        if (!List.of("APPROVED", "REJECTED").contains(targetStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review decision is invalid");
        }
        String currentStatus = currentStatus(id);
        if (!"SUBMITTED".equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only submitted applications can be reviewed");
        }
        long reviewerId = request.reviewerId() == null ? fallbackReviewerId : request.reviewerId();
        ensureUserExists(reviewerId, "reviewerId is invalid");

        sqlExecutor.update("""
            update heritage_applications
            set status = ?,
                current_step = case when ? = 'APPROVED' then 4 else current_step end,
                review_comment = ?,
                reviewer_id = ?,
                reviewed_at = current_timestamp
            where id = ? and deleted = 0
            """,
            targetStatus,
            targetStatus,
            blankToNull(request.reviewComment()),
            reviewerId,
            id
        );
        if ("APPROVED".equals(targetStatus)) {
            createTargetNodeIfMissing(id, reviewerId);
        }
        insertReviewLog(id, currentStatus, targetStatus, request.reviewComment(), reviewerId);
        return getApplication(id);
    }

    private void createTargetNodeIfMissing(long applicationId, long reviewerId) {
        Map<String, Object> application = sqlExecutor.queryForMap("""
            select application_no as applicationNo,
                   application_type as applicationType,
                   title,
                   form_data as formData,
                   target_node_id as targetNodeId,
                   applicant_user_id as applicantUserId
            from heritage_applications
            where id = ? and deleted = 0
            """, applicationId);
        if (application.get("targetNodeId") != null || "RELATION".equals(application.get("applicationType"))) {
            return;
        }

        Long nodeTypeId = nodeTypeIdForApplication(String.valueOf(application.get("applicationType")));
        if (nodeTypeId == null) {
            return;
        }

        String applicationNo = String.valueOf(application.get("applicationNo"));
        String title = String.valueOf(application.get("title"));
        Map<String, Object> formData = readFormData(application.get("formData"));
        String summary = blankToNull(String.valueOf(formData.getOrDefault("summary", "")));
        String projectLevel = blankToNull(String.valueOf(formData.getOrDefault("projectLevel", "")));
        String nodeCode = "application_" + applicationNo.replaceAll("[^A-Za-z0-9_-]", "_");

        Long nodeId = sqlExecutor.insertAndReturnKey("""
            insert into graph_nodes (
              node_code, node_type_id, name, summary, content, project_level,
              owner_user_id, visibility, audit_status, extra_attrs, created_by, updated_by
            ) values (?, ?, ?, ?, ?, ?, ?, 'PUBLIC', 'APPROVED',
              json_object('source_name', 'application_review', 'source_url', ?, 'category', ?), ?, ?)
            on duplicate key update
              name = values(name),
              summary = values(summary),
              content = values(content),
              project_level = values(project_level),
              visibility = 'PUBLIC',
              audit_status = 'APPROVED',
              deleted = 0,
              status = 1,
              updated_by = values(updated_by)
            """,
            nodeCode,
            nodeTypeId,
            title,
            summary,
            summary,
            projectLevel,
            ((Number) application.get("applicantUserId")).longValue(),
            "/admin/review/applications/" + applicationId,
            application.get("applicationType"),
            reviewerId,
            reviewerId
        );
        Long resolvedNodeId = nodeId != null && nodeId > 0
            ? nodeId
            : sqlExecutor.queryForObject("select id from graph_nodes where node_code = ? and deleted = 0", Long.class, nodeCode);
        if (resolvedNodeId != null) {
            sqlExecutor.update("update heritage_applications set target_node_id = ? where id = ? and deleted = 0", resolvedNodeId, applicationId);
        }
    }

    private Long nodeTypeIdForApplication(String applicationType) {
        String typeCode = switch (applicationType) {
            case "INHERITOR" -> "inheritor";
            case "MEDIA" -> "work";
            default -> "heritage_project";
        };
        try {
            return sqlExecutor.queryForObject(
                "select id from graph_node_types where type_code = ? and deleted = 0 and status = 1",
                Long.class,
                typeCode
            );
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readFormData(Object raw) {
        if (raw == null) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(String.valueOf(raw), Map.class);
        } catch (JsonProcessingException exception) {
            return Map.of();
        }
    }

    private List<Map<String, Object>> reviewLogs(long applicationId) {
        return sqlExecutor.queryForList("""
            select
              l.id,
              l.from_status as fromStatus,
              l.to_status as toStatus,
              l.review_comment as reviewComment,
              l.reviewer_id as reviewerId,
              u.nickname as reviewerName,
              l.created_at as createdAt
            from review_logs l
            left join sys_users u on u.id = l.reviewer_id
            where l.business_type = 'APPLICATION' and l.business_id = ?
            order by l.created_at, l.id
            """, applicationId);
    }

    private String buildWhere(String keyword, String status, String applicationType, List<Object> params) {
        return buildWhere(keyword, status, applicationType, null, params);
    }

    private String buildWhere(String keyword, String status, String applicationType, Long applicantUserId, List<Object> params) {
        StringBuilder where = new StringBuilder("a.deleted = 0");
        if (applicantUserId != null) {
            where.append(" and a.applicant_user_id = ?");
            params.add(applicantUserId);
        }
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (a.application_no like ? or a.title like ? or u.nickname like ? or n.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (status != null && !status.isBlank()) {
            where.append(" and a.status = ?");
            params.add(normalizeStatus(status));
        }
        if (applicationType != null && !applicationType.isBlank()) {
            where.append(" and a.application_type = ?");
            params.add(normalizeType(applicationType));
        }
        return where.toString();
    }

    private void ensureApplicationOwnedBy(long id, long userId) {
        long applicantUserId = currentApplicantUserId(id);
        if (applicantUserId != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Application owner permission is required");
        }
    }

    private String currentStatus(long id) {
        try {
            return sqlExecutor.queryForObject(
                "select status from heritage_applications where id = ? and deleted = 0",
                String.class,
                id
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
    }

    private void ensureApplicationExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from heritage_applications where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
    }

    private long currentApplicantUserId(long id) {
        try {
            return sqlExecutor.queryForObject(
                "select applicant_user_id from heritage_applications where id = ? and deleted = 0",
                Long.class,
                id
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
    }

    private String currentApplicationNo(long id) {
        try {
            return sqlExecutor.queryForObject(
                "select application_no from heritage_applications where id = ? and deleted = 0",
                String.class,
                id
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
    }

    private void insertReviewLog(long applicationId, String fromStatus, String toStatus, String reviewComment, Long reviewerId) {
        sqlExecutor.update("""
            insert into review_logs (business_type, business_id, from_status, to_status, review_comment, reviewer_id)
            values ('APPLICATION', ?, ?, ?, ?, ?)
            """,
            applicationId,
            fromStatus,
            toStatus,
            blankToNull(reviewComment),
            reviewerId
        );
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetNodeId is invalid");
        }
    }

    private String normalizeType(String value) {
        String normalized = value == null || value.isBlank() ? "PROJECT" : value.trim().toUpperCase();
        if (!VALID_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "applicationType is invalid");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase();
        if (!VALID_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        }
        return normalized;
    }

    private String toJson(Map<String, Object> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData is invalid");
        }
    }

    private String generateApplicationNo() {
        return "APP-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS").format(LocalDateTime.now());
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private boolean hasUserReference(Long userId, String username) {
        return userId != null || (username != null && !username.isBlank());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
