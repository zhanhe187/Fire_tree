package com.firetree.heritage.features.exhibition.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.exhibition.dto.ExhibitionNodeRequest;
import com.firetree.heritage.features.exhibition.dto.ExhibitionRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.service.AuditLogService;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class ExhibitionMapper {

    private static final List<String> VALID_STATUS = List.of("DRAFT", "PUBLISHED", "OFFLINE");
    private static final String LINKED_NODE_COVER_JOIN = """
        left join (
          select ranked.exhibition_id, ranked.preview_url
          from (
            select
              en.exhibition_id,
              f.preview_url,
              row_number() over (partition by en.exhibition_id order by nm.sort_order, nm.id) as rn
            from exhibition_nodes en
            join graph_node_media nm on nm.node_id = en.node_id
            join media_files f on f.id = nm.file_id
            where f.deleted = 0
              and f.file_type = 'IMAGE'
              and f.visibility = 'PUBLIC'
              and f.audit_status = 'APPROVED'
              and f.preview_url is not null
          ) ranked
          where ranked.rn = 1
        ) linked_cover on linked_cover.exhibition_id = e.id
        """;

    private final MybatisSqlExecutor sqlExecutor;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    public ExhibitionMapper(MybatisSqlExecutor sqlExecutor, ObjectMapper objectMapper, AuditLogService auditLogService) {
        this.sqlExecutor = sqlExecutor;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> searchExhibitions(String keyword, String province, String city, String status, int page, int size, AccessControlService.AuthContext context) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, province, city, status, context, params);

        Integer total = sqlExecutor.queryForObject("select count(*) from exhibitions e where " + where, Integer.class, params.toArray());
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              e.id,
              e.title,
              e.description,
              e.cover_file_id as coverFileId,
              coalesce(mf.preview_url, linked_cover.preview_url) as coverUrl,
              linked_cover.preview_url as linkedNodeCoverUrl,
              e.province,
              e.city,
              e.address,
              e.longitude,
              e.latitude,
              e.start_time as startTime,
              e.end_time as endTime,
              e.organizer,
              e.status,
              e.created_by as createdBy,
              e.created_at as createdAt,
              e.updated_at as updatedAt,
              coalesce(node_count.linkedNodeCount, 0) as linkedNodeCount
            from exhibitions e
            left join media_files mf on mf.id = e.cover_file_id and mf.deleted = 0
            %s
            left join (
              select exhibition_id, count(*) as linkedNodeCount
              from exhibition_nodes
              group by exhibition_id
            ) node_count on node_count.exhibition_id = e.id
            where %s
            order by coalesce(e.start_time, e.updated_at) desc, e.id desc
            limit ?, ?
            """.formatted(LINKED_NODE_COVER_JOIN, where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getExhibition(long id, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(id, context);
        Map<String, Object> exhibition = exhibitionDetail(id);
        if (context == null && !"PUBLISHED".equals(String.valueOf(exhibition.get("status")))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exhibition not found");
        }
        auditLogService.recordBehavior(null, "VIEW_EXHIBITION", "EXHIBITION", id, Map.of("title", exhibition.get("title")));
        return exhibition;
    }

    private Map<String, Object> exhibitionDetail(long id) {
        Map<String, Object> exhibition = exhibitionById(id);
        exhibition.put("linkedNodes", linkedNodes(id));
        exhibition.put("linkedProducts", linkedProducts(id));
        return exhibition;
    }

    @Transactional
    public Map<String, Object> createExhibition(ExhibitionRequest request, long operatorId) {
        requireText(request.title(), "title is required");
        validateCoverFile(request.coverFileId());
        String status = normalizeStatus(request.status());
        long id = sqlExecutor.insertAndReturnKey("""
            insert into exhibitions (
              title, description, cover_file_id, province, city, address, longitude, latitude,
              start_time, end_time, organizer, status, created_by
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            request.title().trim(),
            blankToNull(request.description()),
            request.coverFileId(),
            blankToNull(request.province()),
            blankToNull(request.city()),
            blankToNull(request.address()),
            request.longitude(),
            request.latitude(),
            request.startTime(),
            request.endTime(),
            blankToNull(request.organizer()),
            status,
            operatorId
        );
        ensureGraphNode(id, request, operatorId);
        auditLogService.recordOperation(operatorId, "EXHIBITION_CREATE", "EXHIBITION", id, "POST", "/api/exhibitions", Map.of("title", request.title()));
        Map<String, Object> exhibition = exhibitionDetail(id);
        auditLogService.recordBehavior(null, "VIEW_EXHIBITION", "EXHIBITION", id, Map.of("title", exhibition.get("title")));
        return exhibition;
    }

    @Transactional
    public Map<String, Object> updateExhibition(long id, ExhibitionRequest request, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(id, context);
        validateCoverFile(request.coverFileId());
        sqlExecutor.update("""
            update exhibitions
            set
              title = coalesce(?, title),
              description = coalesce(?, description),
              cover_file_id = ?,
              province = coalesce(?, province),
              city = coalesce(?, city),
              address = coalesce(?, address),
              longitude = ?,
              latitude = ?,
              start_time = ?,
              end_time = ?,
              organizer = coalesce(?, organizer),
              status = coalesce(?, status)
            where id = ? and deleted = 0
            """,
            blankToNull(request.title()),
            blankToNull(request.description()),
            request.coverFileId(),
            blankToNull(request.province()),
            blankToNull(request.city()),
            blankToNull(request.address()),
            request.longitude(),
            request.latitude(),
            request.startTime(),
            request.endTime(),
            blankToNull(request.organizer()),
            request.status() == null || request.status().isBlank() ? null : normalizeStatus(request.status()),
            id
        );
        ensureGraphNode(id, request, context.userId());
        auditLogService.recordOperation(context.userId(), "EXHIBITION_UPDATE", "EXHIBITION", id, "PUT", "/api/exhibitions/" + id, Map.of());
        return getExhibition(id, context);
    }

    @Transactional
    public void deleteExhibition(long id, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(id, context);
        // Physical delete exhibition
        sqlExecutor.update("delete from exhibitions where id = ?", id);
        Long graphNodeId = graphNodeId(id);
        if (graphNodeId != null) {
            // Physically remove attached edges first to satisfy FK constraints
            sqlExecutor.update("delete from graph_edges where source_node_id = ? or target_node_id = ?", graphNodeId, graphNodeId);
            sqlExecutor.update("delete from graph_nodes where id = ?", graphNodeId);
        }
        auditLogService.recordOperation(context.userId(), "EXHIBITION_DELETE", "EXHIBITION", id, "DELETE", "/api/exhibitions/" + id, Map.of());
    }

    @Transactional
    public Map<String, Object> linkNode(long exhibitionId, ExhibitionNodeRequest request, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(exhibitionId, context);
        if (request.nodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is required");
        }
        ensureGraphNodeExists(request.nodeId());
        try {
            sqlExecutor.update("insert into exhibition_nodes (exhibition_id, node_id, booth_no) values (?, ?, ?)",
                exhibitionId, request.nodeId(), blankToNull(request.boothNo()));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Node is already linked to this exhibition");
        }
        upsertDisplayedAtEdge(exhibitionId, request.nodeId(), context.userId());
        auditLogService.recordOperation(context.userId(), "EXHIBITION_LINK_NODE", "EXHIBITION", exhibitionId, "POST", "/api/exhibitions/" + exhibitionId + "/nodes", Map.of("nodeId", request.nodeId()));
        return getExhibition(exhibitionId, context);
    }

    @Transactional
    public void unlinkNode(long exhibitionId, long nodeId, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(exhibitionId, context);
        sqlExecutor.update("delete from exhibition_nodes where exhibition_id = ? and node_id = ?", exhibitionId, nodeId);
        Long exhibitionGraphNodeId = graphNodeId(exhibitionId);
        if (exhibitionGraphNodeId != null) {
            sqlExecutor.update("""
                update graph_edges e
                join graph_edge_types et on et.id = e.edge_type_id and et.type_code = 'displayed_at'
                set e.deleted = 1, e.status = 0
                where e.source_node_id = ? and e.target_node_id = ?
                """, nodeId, exhibitionGraphNodeId);
        }
        auditLogService.recordOperation(context.userId(), "EXHIBITION_UNLINK_NODE", "EXHIBITION", exhibitionId, "DELETE", "/api/exhibitions/" + exhibitionId + "/nodes/" + nodeId, Map.of("nodeId", nodeId));
    }

    @Transactional
    public Map<String, Object> linkProduct(long exhibitionId, ProductLinkRequest request, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(exhibitionId, context);
        ensureProductExists(request.productId());
        try {
            sqlExecutor.update("insert into exhibition_products (exhibition_id, product_id) values (?, ?)", exhibitionId, request.productId());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is already linked to this exhibition");
        }
        auditLogService.recordOperation(context.userId(), "EXHIBITION_LINK_PRODUCT", "EXHIBITION", exhibitionId, "POST", "/api/exhibitions/" + exhibitionId + "/products", Map.of("productId", request.productId()));
        return getExhibition(exhibitionId, context);
    }

    @Transactional
    public void unlinkProduct(long exhibitionId, long productId, AccessControlService.AuthContext context) {
        ensureExhibitionOwned(exhibitionId, context);
        sqlExecutor.update("delete from exhibition_products where exhibition_id = ? and product_id = ?", exhibitionId, productId);
        auditLogService.recordOperation(context.userId(), "EXHIBITION_UNLINK_PRODUCT", "EXHIBITION", exhibitionId, "DELETE", "/api/exhibitions/" + exhibitionId + "/products/" + productId, Map.of("productId", productId));
    }

    private String buildWhere(String keyword, String province, String city, String status, AccessControlService.AuthContext context, List<Object> params) {
        StringBuilder where = new StringBuilder("e.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (e.title like ? or e.description like ? or e.organizer like ? or e.address like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (province != null && !province.isBlank()) {
            where.append(" and e.province = ?");
            params.add(province.trim());
        }
        if (city != null && !city.isBlank()) {
            where.append(" and e.city = ?");
            params.add(city.trim());
        }
        if (status != null && !status.isBlank()) {
            where.append(" and e.status = ?");
            params.add(normalizeStatus(status));
        }
        if (context != null && !context.isSuperAdmin()) {
            where.append(" and e.created_by = ?");
            params.add(context.userId());
        }
        return where.toString();
    }

    private Map<String, Object> exhibitionById(long id) {
        try {
            return new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  e.id,
                  e.title,
                  e.description,
                  e.cover_file_id as coverFileId,
                  coalesce(mf.preview_url, linked_cover.preview_url) as coverUrl,
                  linked_cover.preview_url as linkedNodeCoverUrl,
                  e.province,
                  e.city,
                  e.address,
                  e.longitude,
                  e.latitude,
                  e.start_time as startTime,
                  e.end_time as endTime,
                  e.organizer,
                  e.status,
                  e.created_by as createdBy,
                  u.nickname as creatorName,
                  e.created_at as createdAt,
                  e.updated_at as updatedAt
                from exhibitions e
                left join media_files mf on mf.id = e.cover_file_id and mf.deleted = 0
                %s
                left join sys_users u on u.id = e.created_by and u.deleted = 0
                where e.id = ? and e.deleted = 0
                """.formatted(LINKED_NODE_COVER_JOIN), id));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exhibition not found");
        }
    }

    private List<Map<String, Object>> linkedNodes(long exhibitionId) {
        return sqlExecutor.queryForList("""
            select
              en.id,
              en.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              en.booth_no as boothNo,
              en.created_at as createdAt
            from exhibition_nodes en
            join graph_nodes n on n.id = en.node_id and n.deleted = 0
            join graph_node_types nt on nt.id = n.node_type_id
            where en.exhibition_id = ?
            order by en.created_at desc, en.id desc
            """, exhibitionId);
    }

    private List<Map<String, Object>> linkedProducts(long exhibitionId) {
        return sqlExecutor.queryForList("""
            select
              ep.id,
              p.id as productId,
              p.product_code as productCode,
              p.name as productName,
              p.description,
              mf.preview_url as coverUrl,
              p.price,
              p.stock,
              p.status,
              ep.created_at as createdAt
            from exhibition_products ep
            join creative_products p on p.id = ep.product_id and p.deleted = 0
            left join media_files mf on mf.id = p.cover_file_id and mf.deleted = 0
            where ep.exhibition_id = ?
            order by ep.created_at desc, ep.id desc
            """, exhibitionId);
    }

    private void ensureGraphNode(long exhibitionId, ExhibitionRequest request, long operatorId) {
        Long nodeTypeId = sqlExecutor.queryForObject("select id from graph_node_types where type_code = 'exhibition_market'", Long.class);
        if (nodeTypeId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Exhibition node type is not configured");
        }
        String nodeCode = "exhibition_" + exhibitionId;
        Map<String, Object> extraAttrsMap = new LinkedHashMap<>();
        extraAttrsMap.put("exhibitionId", exhibitionId);
        if (request.organizer() != null && !request.organizer().isBlank()) {
            extraAttrsMap.put("organizer", request.organizer().trim());
        }
        String extraAttrs = toJson(extraAttrsMap);
        Integer existing = sqlExecutor.queryForObject("select count(*) from graph_nodes where node_code = ?", Integer.class, nodeCode);
        if (existing != null && existing > 0) {
            sqlExecutor.update("""
                update graph_nodes
                set name = coalesce(?, name), summary = coalesce(?, summary), province = coalesce(?, province),
                    city = coalesce(?, city), longitude = coalesce(?, longitude), latitude = coalesce(?, latitude),
                    visibility = 'PUBLIC', audit_status = 'APPROVED', extra_attrs = cast(? as json), status = 1, deleted = 0
                where node_code = ?
                """,
                request.title(),
                blankToNull(request.description()),
                blankToNull(request.province()),
                blankToNull(request.city()),
                request.longitude(),
                request.latitude(),
                extraAttrs,
                nodeCode
            );
        } else {
            sqlExecutor.update("""
                insert into graph_nodes (
                  node_code, node_type_id, name, summary, province, city, longitude, latitude,
                  visibility, audit_status, extra_attrs, owner_user_id, created_by
                ) values (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLIC', 'APPROVED', cast(? as json), ?, ?)
                """,
                nodeCode,
                nodeTypeId,
                request.title(),
                blankToNull(request.description()),
                blankToNull(request.province()),
                blankToNull(request.city()),
                request.longitude(),
                request.latitude(),
                extraAttrs,
                operatorId,
                operatorId
            );
        }
    }

    private void upsertDisplayedAtEdge(long exhibitionId, long sourceNodeId, long operatorId) {
        // 历史展览（SQL 种子数据或早期版本创建）没有对应的 exhibition_{id} 图谱节点，
        // 这里按需补建，避免直接抛 500 让前端只看到“后台服务暂时不可用”。
        long exhibitionGraphNodeId = ensureExhibitionGraphNode(exhibitionId, operatorId);
        if (exhibitionGraphNodeId == sourceNodeId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能把展览自身的图谱节点挂接到该展览");
        }
        Long edgeTypeId = sqlExecutor.queryForObject("select id from graph_edge_types where type_code = 'displayed_at'", Long.class);
        if (edgeTypeId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Exhibition edge type is not configured");
        }
        Integer existing = sqlExecutor.queryForObject("""
            select count(*)
            from graph_edges
            where source_node_id = ? and target_node_id = ? and edge_type_id = ?
            """, Integer.class, sourceNodeId, exhibitionGraphNodeId, edgeTypeId);
        String relationLabel = "\u5c55\u51fa\u4e8e";
        if (existing != null && existing > 0) {
            sqlExecutor.update("""
                update graph_edges
                set deleted = 0, status = 1, audit_status = 'APPROVED', relation_label = ?
                where source_node_id = ? and target_node_id = ? and edge_type_id = ?
                """, relationLabel, sourceNodeId, exhibitionGraphNodeId, edgeTypeId);
            return;
        }
        sqlExecutor.update("""
            insert into graph_edges (
              source_node_id, target_node_id, edge_type_id, directed, relation_label, audit_status, owner_user_id
            ) values (?, ?, ?, 1, ?, 'APPROVED', ?)
            """, sourceNodeId, exhibitionGraphNodeId, edgeTypeId, relationLabel, operatorId);
    }
    /**
     * 保证展览拥有对应的图谱节点（node_code = exhibition_{id}）。
     *
     * <p>新建展览会走 {@link #ensureGraphNode} 建节点，但 SQL 种子数据与早期版本创建的展览没有节点。
     * 挂接节点需要这条节点来建立 displayed_at 关系边，因此在这里按需补建，而不是抛 500。</p>
     */
    private long ensureExhibitionGraphNode(long exhibitionId, long operatorId) {
        Long existing = graphNodeId(exhibitionId);
        if (existing != null) {
            return existing;
        }
        Map<String, Object> exhibition;
        try {
            exhibition = sqlExecutor.queryForMap("""
                select title, description, province, city, longitude, latitude, organizer
                from exhibitions
                where id = ? and deleted = 0
                """, exhibitionId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exhibition not found");
        }
        Long nodeTypeId = sqlExecutor.queryForObject("select id from graph_node_types where type_code = 'exhibition_market'", Long.class);
        if (nodeTypeId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Exhibition node type is not configured");
        }
        String nodeCode = "exhibition_" + exhibitionId;
        Map<String, Object> extraAttrsMap = new LinkedHashMap<>();
        extraAttrsMap.put("exhibitionId", exhibitionId);
        Object organizer = exhibition.get("organizer");
        if (organizer != null && !String.valueOf(organizer).isBlank()) {
            extraAttrsMap.put("organizer", String.valueOf(organizer).trim());
        }
        String extraAttrs = toJson(extraAttrsMap);
        String name = asText(exhibition.get("title"));
        String summary = asText(exhibition.get("description"));
        String province = asText(exhibition.get("province"));
        String city = asText(exhibition.get("city"));
        Object longitude = exhibition.get("longitude");
        Object latitude = exhibition.get("latitude");

        // node_code 带唯一约束：按“任意状态（含逻辑删除）”统计，避免复活行与插入撞键。
        Integer anyExisting = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where node_code = ?",
            Integer.class,
            nodeCode
        );
        if (anyExisting != null && anyExisting > 0) {
            sqlExecutor.update("""
                update graph_nodes
                set name = coalesce(?, name), summary = coalesce(?, summary), province = coalesce(?, province),
                    city = coalesce(?, city), longitude = ?, latitude = ?,
                    visibility = 'PUBLIC', audit_status = 'APPROVED', extra_attrs = cast(? as json), status = 1, deleted = 0
                where node_code = ?
                """,
                name,
                summary,
                province,
                city,
                longitude,
                latitude,
                extraAttrs,
                nodeCode
            );
            Long revived = graphNodeId(exhibitionId);
            if (revived == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "展览图谱节点补建失败，请重试");
            }
            return revived;
        }
        return sqlExecutor.insertAndReturnKey("""
            insert into graph_nodes (
              node_code, node_type_id, name, summary, province, city, longitude, latitude,
              visibility, audit_status, extra_attrs, owner_user_id, created_by
            ) values (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLIC', 'APPROVED', cast(? as json), ?, ?)
            """,
            nodeCode,
            nodeTypeId,
            name == null ? ("展览 " + exhibitionId) : name,
            summary,
            province,
            city,
            longitude,
            latitude,
            extraAttrs,
            operatorId,
            operatorId
        );
    }

    private Long graphNodeId(long exhibitionId) {
        try {
            return sqlExecutor.queryForObject("select id from graph_nodes where node_code = ? and deleted = 0", Long.class, "exhibition_" + exhibitionId);
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    private void ensureExhibitionExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from exhibitions where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exhibition not found");
        }
    }

    private void ensureExhibitionOwned(long id, AccessControlService.AuthContext context) {
        ensureExhibitionExists(id);
        if (context == null || context.isSuperAdmin()) {
            return;
        }
        Long createdBy = sqlExecutor.queryForObject(
            "select created_by from exhibitions where id = ? and deleted = 0",
            Long.class,
            id
        );
        if (createdBy == null || createdBy != context.userId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Exhibition belongs to another user");
        }
    }

    private void ensureProductExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from creative_products where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found");
        }
    }

    private void validateCoverFile(Long coverFileId) {
        if (coverFileId == null) {
            return;
        }
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from media_files where id = ? and deleted = 0 and file_type = 'IMAGE'",
            Integer.class,
            coverFileId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cover image not found");
        }
    }

    private void ensureGraphNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from graph_nodes where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Graph node not found");
        }
    }

    private String normalizeStatus(String value) {
        String normalized = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase();
        if (!VALID_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        }
        return normalized;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String asText(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
