package com.firetree.heritage.features.graph.mapper;

import com.firetree.heritage.features.graph.dto.GraphNodeRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class GraphNodeMapper {

    private static final List<String> VALID_VISIBILITY = List.of("PUBLIC", "PRIVATE");
    private static final List<String> VALID_AUDIT_STATUS = List.of("DRAFT", "PENDING", "APPROVED", "REJECTED");
    private static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");
    private static final String COVER_IMAGE_JOIN = """
        left join (
          select ranked.node_id, ranked.preview_url, ranked.caption
          from (
            select
              nm.node_id,
              f.preview_url,
              nm.caption,
              row_number() over (partition by nm.node_id order by nm.sort_order, nm.id) as rn
            from graph_node_media nm
            join media_files f on f.id = nm.file_id
            where f.deleted = 0
              and f.file_type = 'IMAGE'
              and f.visibility = 'PUBLIC'
              and f.audit_status = 'APPROVED'
              and f.preview_url is not null
          ) ranked
          where ranked.rn = 1
        ) cover on cover.node_id = n.id
        """;

    private final MybatisSqlExecutor sqlExecutor;

    public GraphNodeMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> nodeTypes() {
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select id, type_code as typeCode, type_name as typeName, description, icon, color, sort_order as sortOrder
            from graph_node_types
            where deleted = 0 and status = 1
            order by sort_order, id
            """);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", items.size());
        result.put("items", items);
        return result;
    }

    public Map<String, Object> searchNodes(String keyword, Long nodeTypeId, String auditStatus, int page, int size) {
        int safePage = Math.max(page, 1);
        // 上限 500：挂接/关联类下拉需要在一次请求内拿到足够候选（当前库 253 个节点）。
        // 超过 500 时仍应依赖关键词搜索，而不是继续放大这个上限。
        int safeSize = Math.min(Math.max(size, 1), 500);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, nodeTypeId, auditStatus, params);

        Integer total = sqlExecutor.queryForObject("select count(*) from graph_nodes n where " + where, Integer.class, params.toArray());
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);

        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.alias,
              n.summary,
              n.content,
              n.province,
              n.city,
              n.district,
              n.address,
              n.historical_period as historicalPeriod,
              n.project_level as projectLevel,
              n.visibility,
              n.audit_status as auditStatus,
              n.popularity_count as popularityCount,
              n.updated_at as updatedAt,
              t.id as nodeTypeId,
              t.type_code as nodeTypeCode,
              t.type_name as nodeTypeName,
              t.color as nodeTypeColor,
              coalesce(nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.category')), ''), 'null'), t.type_name) as category,
              nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.source_name')), ''), 'null') as sourceName,
              nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.source_url')), ''), 'null') as sourceUrl,
              cast(nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.birthYear')), ''), 'null') as unsigned) as birthYear,
              cover.preview_url as coverImageUrl,
              cover.caption as coverImageCaption
            from graph_nodes n
            join graph_node_types t on t.id = n.node_type_id
            %s
            where %s
            order by n.updated_at desc, n.id desc
            limit ?, ?
            """.formatted(COVER_IMAGE_JOIN, where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getNode(long id) {
        return getNode(id, false);
    }

    public Map<String, Object> getNode(long id, boolean includeAllMedia) {
        try {
            Map<String, Object> node = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  n.id,
                  n.node_code as nodeCode,
                  n.node_type_id as nodeTypeId,
                  t.type_code as nodeTypeCode,
                  t.type_name as nodeTypeName,
                  coalesce(nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.category')), ''), 'null'), t.type_name) as category,
                  nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.source_name')), ''), 'null') as sourceName,
                  nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.source_url')), ''), 'null') as sourceUrl,
                  cast(nullif(nullif(json_unquote(json_extract(n.extra_attrs, '$.birthYear')), ''), 'null') as unsigned) as birthYear,
                  n.name,
                  n.alias,
                  n.summary,
                  n.content,
                  n.province,
                  n.city,
                  n.district,
                  n.address,
                  n.longitude,
                  n.latitude,
                  n.historical_period as historicalPeriod,
                  n.project_level as projectLevel,
                  cover.preview_url as coverImageUrl,
                  cover.caption as coverImageCaption,
                  n.visibility,
                  n.audit_status as auditStatus,
                  n.popularity_count as popularityCount,
                  n.created_at as createdAt,
                  n.updated_at as updatedAt
                from graph_nodes n
                join graph_node_types t on t.id = n.node_type_id
                %s
                where n.id = ? and n.deleted = 0
                """.formatted(COVER_IMAGE_JOIN), id));
            node.put("mediaFiles", nodeMediaFiles(id, includeAllMedia));
            return node;
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Node not found");
        }
    }

    public List<Map<String, Object>> getNodeMediaFiles(long nodeId, boolean includeAllMedia) {
        ensureNodeExists(nodeId);
        return nodeMediaFiles(nodeId, includeAllMedia);
    }

    @Transactional
    public Map<String, Object> createNode(GraphNodeRequest request, long operatorId, boolean superAdmin) {
        requireText(request.nodeCode(), "nodeCode is required");
        requireText(request.name(), "name is required");
        requireNodeType(request.nodeTypeId());
        String visibility = normalizeVisibility(request.visibility());
        String auditStatus = normalizeAuditStatus(request.auditStatus());

        Map<String, Object> existingByCode = findNodeByCode(request.nodeCode().trim());
        if (existingByCode != null) {
            long existingId = ((Number) existingByCode.get("id")).longValue();
            Object deletedFlag = existingByCode.get("deleted");
            boolean softDeleted = deletedFlag instanceof Number number && number.intValue() == 1;
            if (!softDeleted) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Node code already exists");
            }
            reviveSoftDeletedNode(existingId, request, operatorId, visibility, auditStatus);
            upsertCoverImage(existingId, request.coverImageUrl(), request.coverImageCaption());
            return getNode(existingId);
        }

        long key;
        try {
            key = sqlExecutor.insertAndReturnKey("""
                insert into graph_nodes (
                  node_code, node_type_id, name, alias, summary, content, province, city, district,
                  address, historical_period, project_level, owner_user_id, visibility, audit_status,
                  extra_attrs, created_by, updated_by
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, json_object('category', ?, 'source_name', ?, 'source_url', ?, 'birthYear', ?), ?, ?)
                """,
                request.nodeCode().trim(),
                request.nodeTypeId(),
                request.name(),
                blankToNull(request.alias()),
                request.summary(),
                request.content(),
                request.province(),
                request.city(),
                request.district(),
                request.address(),
                request.historicalPeriod(),
                request.projectLevel(),
                operatorId,
                visibility,
                auditStatus,
                blankToNull(request.category()),
                blankToNull(request.sourceName()),
                blankToNull(request.sourceUrl()),
                normalizeBirthYear(request.birthYear()),
                operatorId,
                operatorId
            );
        } catch (DataIntegrityViolationException exception) {
            // A ghost soft-deleted row may still occupy the unique key; purge it and retry once
            sqlExecutor.update("delete from graph_nodes where node_code = ? and deleted = 1", request.nodeCode().trim());
            try {
                key = sqlExecutor.insertAndReturnKey("""
                    insert into graph_nodes (
                      node_code, node_type_id, name, alias, summary, content, province, city, district,
                      address, historical_period, project_level, owner_user_id, visibility, audit_status,
                      extra_attrs, created_by, updated_by
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, json_object('category', ?, 'source_name', ?, 'source_url', ?, 'birthYear', ?), ?, ?)
                    """,
                    request.nodeCode().trim(),
                    request.nodeTypeId(),
                    request.name(),
                    blankToNull(request.alias()),
                    request.summary(),
                    request.content(),
                    request.province(),
                    request.city(),
                    request.district(),
                    request.address(),
                    request.historicalPeriod(),
                    request.projectLevel(),
                    operatorId,
                    visibility,
                    auditStatus,
                    blankToNull(request.category()),
                    blankToNull(request.sourceName()),
                    blankToNull(request.sourceUrl()),
                    normalizeBirthYear(request.birthYear()),
                    operatorId,
                    operatorId
                );
            } catch (DataIntegrityViolationException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Node code already exists");
            }
        }

        upsertCoverImage(key, request.coverImageUrl(), request.coverImageCaption());
        return getNode(key);
    }

    private Map<String, Object> findNodeByCode(String nodeCode) {
        // Do not filter by deleted here: createNode relies on seeing soft-deleted
        // rows to revive them, and alive rows to reject duplicate codes.
        List<Map<String, Object>> rows = sqlExecutor.queryForList(
            "select id, deleted from graph_nodes where node_code = ? order by deleted",
            nodeCode
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void reviveSoftDeletedNode(long id, GraphNodeRequest request, long operatorId, String visibility, String auditStatus) {
        sqlExecutor.update("""
            update graph_nodes
            set
              node_type_id = ?,
              name = ?,
              alias = ?,
              summary = ?,
              content = ?,
              province = ?,
              city = ?,
              district = ?,
              address = ?,
              historical_period = ?,
              project_level = ?,
              owner_user_id = ?,
              visibility = ?,
              audit_status = ?,
              extra_attrs = json_object('category', ?, 'source_name', ?, 'source_url', ?, 'birthYear', ?),
              deleted = 0,
              status = 1,
              updated_by = ?
            where id = ? and deleted = 1
            """,
            request.nodeTypeId(),
            request.name(),
            blankToNull(request.alias()),
            request.summary(),
            request.content(),
            request.province(),
            request.city(),
            request.district(),
            request.address(),
            request.historicalPeriod(),
            request.projectLevel(),
            operatorId,
            visibility,
            auditStatus,
            blankToNull(request.category()),
            blankToNull(request.sourceName()),
            blankToNull(request.sourceUrl()),
            normalizeBirthYear(request.birthYear()),
            operatorId,
            id
        );
    }

    @Transactional
    public Map<String, Object> updateNode(long id, GraphNodeRequest request, long operatorId, boolean superAdmin) {
        ensureCanMutateNode(id, operatorId, superAdmin);
        String visibility = normalizeVisibility(request.visibility());
        String auditStatus = normalizeAuditStatus(request.auditStatus());

        sqlExecutor.update("""
            update graph_nodes
            set
              name = coalesce(?, name),
              alias = coalesce(?, alias),
              summary = coalesce(?, summary),
              content = coalesce(?, content),
              province = coalesce(?, province),
              city = coalesce(?, city),
              district = coalesce(?, district),
              address = coalesce(?, address),
              historical_period = coalesce(?, historical_period),
              project_level = coalesce(?, project_level),
              extra_attrs = json_merge_patch(
                coalesce(extra_attrs, json_object()),
                json_object('category', ?, 'source_name', ?, 'source_url', ?, 'birthYear', ?)
              ),
              visibility = coalesce(?, visibility),
              audit_status = coalesce(?, audit_status),
              updated_by = ?
            where id = ? and deleted = 0
            """,
            blankToNull(request.name()),
            blankToNull(request.alias()),
            blankToNull(request.summary()),
            blankToNull(request.content()),
            request.province(),
            request.city(),
            request.district(),
            request.address(),
            request.historicalPeriod(),
            request.projectLevel(),
            blankToNull(request.category()),
            blankToNull(request.sourceName()),
            blankToNull(request.sourceUrl()),
            normalizeBirthYear(request.birthYear()),
            request.visibility() == null || request.visibility().isBlank() ? null : visibility,
            request.auditStatus() == null || request.auditStatus().isBlank() ? null : auditStatus,
            operatorId,
            id
        );

        upsertCoverImage(id, request.coverImageUrl(), request.coverImageCaption());
        return getNode(id);
    }

    @Transactional
    public void deleteNode(long id, long operatorId, boolean superAdmin) {
        ensureCanMutateNode(id, operatorId, superAdmin);
        // Physically remove attached edges first to satisfy FK constraints and avoid ghost edges
        sqlExecutor.update("delete from graph_edges where source_node_id = ? or target_node_id = ?", id, id);
        // Soft delete the node row: read paths filter deleted = 0, and createNode
        // revives the row when the same node code is used again.
        sqlExecutor.update("update graph_nodes set deleted = 1 where id = ?", id);
    }

    private String buildWhere(String keyword, Long nodeTypeId, String auditStatus, List<Object> params) {
        StringBuilder where = new StringBuilder("n.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            // 地区词（长沙 / 湘西州…）也要能命中：浏览页标题承诺「按地区…看」。
            where.append(" and (n.name like ? or n.alias like ? or n.summary like ? or n.node_code like ?"
                + " or n.province like ? or n.city like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (nodeTypeId != null) {
            where.append(" and n.node_type_id = ?");
            params.add(nodeTypeId);
        }
        if (auditStatus != null && !auditStatus.isBlank()) {
            where.append(" and n.audit_status = ?");
            params.add(normalizeAuditStatus(auditStatus));
        }
        return where.toString();
    }

    private List<Map<String, Object>> nodeMediaFiles(long nodeId, boolean includeAllMedia) {
        String mediaVisibilityWhere = includeAllMedia ? "" : """
              and f.visibility = 'PUBLIC'
              and f.audit_status = 'APPROVED'
            """;
        return sqlExecutor.queryForList("""
            select
              nm.id as linkId,
              f.id,
              f.id as fileId,
              f.bucket_name as bucketName,
              f.object_key as objectKey,
              f.original_name as originalName,
              f.file_type as fileType,
              f.content_type as contentType,
              f.file_size as fileSize,
              f.preview_url as previewUrl,
              nm.caption,
              nm.sort_order as sortOrder,
              f.created_at as createdAt,
              f.updated_at as updatedAt
            from graph_node_media nm
            join media_files f on f.id = nm.file_id
            where nm.node_id = ?
              and f.deleted = 0
              %s
            order by nm.sort_order, nm.id
            """.formatted(mediaVisibilityWhere), nodeId);
    }

    private void requireNodeType(Long nodeTypeId) {
        if (nodeTypeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeTypeId is required");
        }
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_node_types where id = ? and deleted = 0 and status = 1",
            Integer.class,
            nodeTypeId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeTypeId is invalid");
        }
    }

    private void ensureNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Node not found");
        }
    }

    private void ensureCanMutateNode(long id, long operatorId, boolean superAdmin) {
        ensureNodeExists(id);
        if (superAdmin) {
            return;
        }
        Integer allowed = sqlExecutor.queryForObject("""
            select count(*)
            from graph_nodes
            where id = ?
              and deleted = 0
              and (owner_user_id = ? or created_by = ?)
            """, Integer.class, id, operatorId, operatorId);
        if (allowed == null || allowed == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owned nodes can be modified");
        }
    }

    private void upsertCoverImage(long nodeId, String coverImageUrl, String coverImageCaption) {
        if (coverImageUrl == null) {
            return;
        }
        if (coverImageUrl.isBlank()) {
            sqlExecutor.update("""
                update media_files f
                join graph_node_media nm on nm.file_id = f.id
                set f.deleted = 1
                where nm.node_id = ?
                  and f.bucket_name = 'admin-cover'
                  and f.object_key = ?
                """, nodeId, "admin-cover/nodes/" + nodeId);
            return;
        }
        String objectKey = "admin-cover/nodes/" + nodeId;
        String caption = blankToNull(coverImageCaption);
        sqlExecutor.update("""
            insert into media_files (
              bucket_name, object_key, original_name, file_type, content_type,
              file_size, preview_url, visibility, audit_status, deleted
            ) values (?, ?, ?, 'IMAGE', 'image/*', 0, ?, 'PUBLIC', 'APPROVED', 0)
            on duplicate key update
              original_name = values(original_name),
              preview_url = values(preview_url),
              visibility = 'PUBLIC',
              audit_status = 'APPROVED',
              deleted = 0
            """,
            "admin-cover",
            objectKey,
            caption == null ? "节点封面图" : caption,
            coverImageUrl.trim()
        );
        Long fileId = sqlExecutor.queryForObject(
            "select id from media_files where object_key = ? and deleted = 0",
            Long.class,
            objectKey
        );
        if (fileId == null) {
            return;
        }
        Integer existing = sqlExecutor.queryForObject(
            "select count(*) from graph_node_media where node_id = ? and file_id = ?",
            Integer.class,
            nodeId,
            fileId
        );
        if (existing != null && existing > 0) {
            sqlExecutor.update(
                "update graph_node_media set caption = ?, sort_order = -100 where node_id = ? and file_id = ?",
                caption,
                nodeId,
                fileId
            );
        } else {
            sqlExecutor.update(
                "insert into graph_node_media (node_id, file_id, caption, sort_order) values (?, ?, ?, -100)",
                nodeId,
                fileId,
                caption
            );
        }
    }

    private String normalizeVisibility(String value) {
        String normalized = value == null || value.isBlank() ? "PUBLIC" : value.trim().toUpperCase();
        if (!VALID_VISIBILITY.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "visibility is invalid");
        }
        return normalized;
    }

    private String normalizeAuditStatus(String value) {
        String normalized = value == null || value.isBlank() ? "APPROVED" : value.trim().toUpperCase();
        if (!VALID_AUDIT_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "auditStatus is invalid");
        }
        return normalized;
    }

    private Integer normalizeBirthYear(Integer birthYear) {
        if (birthYear == null) {
            return null;
        }
        int currentYear = Year.now(CHINA_ZONE).getValue();
        if (birthYear < 1850 || birthYear > currentYear) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "birthYear is invalid");
        }
        return birthYear;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
