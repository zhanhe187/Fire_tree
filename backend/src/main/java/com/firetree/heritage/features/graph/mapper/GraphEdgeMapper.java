package com.firetree.heritage.features.graph.mapper;

import com.firetree.heritage.features.graph.dto.GraphEdgeRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class GraphEdgeMapper {

    private static final List<String> VALID_AUDIT_STATUS = List.of("DRAFT", "PENDING", "APPROVED", "REJECTED");

    private final MybatisSqlExecutor sqlExecutor;

    public GraphEdgeMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> edgeTypes() {
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              id,
              type_code as typeCode,
              type_name as typeName,
              inverse_name as inverseName,
              directed,
              description
            from graph_edge_types
            where deleted = 0 and status = 1
            order by id
            """);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", items.size());
        result.put("items", items);
        return result;
    }

    public Map<String, Object> searchEdges(String keyword, Long edgeTypeId, String auditStatus, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, edgeTypeId, auditStatus, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from graph_edges e
            join graph_nodes s on s.id = e.source_node_id
            join graph_nodes t on t.id = e.target_node_id
            join graph_edge_types et on et.id = e.edge_type_id
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              e.id,
              e.source_node_id as sourceNodeId,
              s.name as sourceNodeName,
              s.node_code as sourceNodeCode,
              e.target_node_id as targetNodeId,
              t.name as targetNodeName,
              t.node_code as targetNodeCode,
              e.edge_type_id as edgeTypeId,
              et.type_code as edgeTypeCode,
              et.type_name as edgeTypeName,
              e.directed,
              e.weight,
              e.relation_label as relationLabel,
              e.start_year as startYear,
              e.end_year as endYear,
              e.audit_status as auditStatus,
              e.updated_at as updatedAt
            from graph_edges e
            join graph_nodes s on s.id = e.source_node_id
            join graph_nodes t on t.id = e.target_node_id
            join graph_edge_types et on et.id = e.edge_type_id
            where %s
            order by e.updated_at desc, e.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getEdge(long id) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  e.id,
                  e.source_node_id as sourceNodeId,
                  s.name as sourceNodeName,
                  s.node_code as sourceNodeCode,
                  e.target_node_id as targetNodeId,
                  t.name as targetNodeName,
                  t.node_code as targetNodeCode,
                  e.edge_type_id as edgeTypeId,
                  et.type_code as edgeTypeCode,
                  et.type_name as edgeTypeName,
                  e.directed,
                  e.weight,
                  e.relation_label as relationLabel,
                  e.start_year as startYear,
                  e.end_year as endYear,
                  e.evidence,
                  e.audit_status as auditStatus,
                  e.created_at as createdAt,
                  e.updated_at as updatedAt
                from graph_edges e
                join graph_nodes s on s.id = e.source_node_id
                join graph_nodes t on t.id = e.target_node_id
                join graph_edge_types et on et.id = e.edge_type_id
                where e.id = ? and e.deleted = 0
                """, id);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Edge not found");
        }
    }

    @Transactional
    public Map<String, Object> createEdge(GraphEdgeRequest request) {
        requireEndpoint(request.sourceNodeId(), "sourceNodeId is required");
        requireEndpoint(request.targetNodeId(), "targetNodeId is required");
        requireEdgeType(request.edgeTypeId());
        if (Objects.equals(request.sourceNodeId(), request.targetNodeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Self-loop edges are not allowed");
        }
        ensureNodeExists(request.sourceNodeId());
        ensureNodeExists(request.targetNodeId());
        String auditStatus = normalizeAuditStatus(request.auditStatus());
        boolean directed = request.directed() == null || request.directed();
        BigDecimal weight = request.weight() == null ? BigDecimal.ONE : request.weight();

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into graph_edges (
                  source_node_id, target_node_id, edge_type_id, directed, weight, relation_label, start_year, end_year, audit_status
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                request.sourceNodeId(),
                request.targetNodeId(),
                request.edgeTypeId(),
                directed,
                weight,
                request.relationLabel(),
                request.startYear(),
                request.endYear(),
                auditStatus
            );
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate edge is not allowed", exception);
        }

        return getEdge(id);
    }

    @Transactional
    public Map<String, Object> updateEdge(long id, GraphEdgeRequest request) {
        ensureEdgeExists(id);
        Map<String, Object> existing = getEdge(id);
        long sourceId = request.sourceNodeId() != null
            ? request.sourceNodeId()
            : ((Number) existing.get("sourceNodeId")).longValue();
        long targetId = request.targetNodeId() != null
            ? request.targetNodeId()
            : ((Number) existing.get("targetNodeId")).longValue();
        long edgeTypeId = request.edgeTypeId() != null
            ? request.edgeTypeId()
            : ((Number) existing.get("edgeTypeId")).longValue();
        if (Objects.equals(sourceId, targetId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Self-loop edges are not allowed");
        }
        ensureNodeExists(sourceId);
        ensureNodeExists(targetId);
        requireEdgeType(edgeTypeId);
        ensureNoDuplicateEdge(id, sourceId, targetId, edgeTypeId);

        String auditStatus = request.auditStatus() == null || request.auditStatus().isBlank()
            ? (String) existing.get("auditStatus")
            : normalizeAuditStatus(request.auditStatus());
        BigDecimal weight = request.weight() != null
            ? request.weight()
            : (BigDecimal) existing.get("weight");
        boolean directed = request.directed() != null
            ? request.directed()
            : ((Number) existing.get("directed")).intValue() != 0;
        String relationLabel = request.relationLabel() == null || request.relationLabel().isBlank()
            ? (String) existing.get("relationLabel")
            : request.relationLabel();
        Integer startYear = request.startYear() != null ? request.startYear() : (Integer) existing.get("startYear");
        Integer endYear = request.endYear() != null ? request.endYear() : (Integer) existing.get("endYear");

        sqlExecutor.update("""
            update graph_edges
            set
              source_node_id = ?,
              target_node_id = ?,
              edge_type_id = ?,
              directed = ?,
              weight = ?,
              relation_label = ?,
              start_year = ?,
              end_year = ?,
              audit_status = ?
            where id = ? and deleted = 0
            """,
            sourceId,
            targetId,
            edgeTypeId,
            directed,
            weight,
            relationLabel,
            startYear,
            endYear,
            auditStatus,
            id
        );

        return getEdge(id);
    }

    @Transactional
    public void deleteEdge(long id) {
        ensureEdgeExists(id);
        // Physical delete to avoid unique-key conflicts with previously soft-deleted ghost rows
        sqlExecutor.update("delete from graph_edges where id = ?", id);
    }

    private String buildWhere(String keyword, Long edgeTypeId, String auditStatus, List<Object> params) {
        StringBuilder where = new StringBuilder("e.deleted = 0 and s.deleted = 0 and t.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append("""
                 and (
                  s.name like ? or s.node_code like ? or
                  t.name like ? or t.node_code like ? or
                  et.type_name like ? or e.relation_label like ?
                )
                """);
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (edgeTypeId != null) {
            where.append(" and e.edge_type_id = ?");
            params.add(edgeTypeId);
        }
        if (auditStatus != null && !auditStatus.isBlank()) {
            where.append(" and e.audit_status = ?");
            params.add(normalizeAuditStatus(auditStatus));
        }
        return where.toString();
    }

    private void ensureNodeExists(Long nodeId) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where id = ? and deleted = 0 and status = 1",
            Integer.class,
            nodeId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edge endpoint node is invalid");
        }
    }

    private void ensureEdgeExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_edges where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Edge not found");
        }
    }

    private void ensureNoDuplicateEdge(long id, Long sourceNodeId, Long targetNodeId, Long edgeTypeId) {
        Integer count = sqlExecutor.queryForObject(
            """
                select count(*)
                from graph_edges
                where deleted = 0
                  and source_node_id = ?
                  and target_node_id = ?
                  and edge_type_id = ?
                  and id != ?
                """,
            Integer.class,
            sourceNodeId,
            targetNodeId,
            edgeTypeId,
            id
        );
        if (count != null && count > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate edge is not allowed");
        }
    }

    private void requireEdgeType(Long edgeTypeId) {
        if (edgeTypeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "edgeTypeId is required");
        }
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_edge_types where id = ? and deleted = 0 and status = 1",
            Integer.class,
            edgeTypeId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "edgeTypeId is invalid");
        }
    }

    private String normalizeAuditStatus(String value) {
        String normalized = value == null || value.isBlank() ? "APPROVED" : value.trim().toUpperCase();
        if (!VALID_AUDIT_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "auditStatus is invalid");
        }
        return normalized;
    }

    private void requireEndpoint(Long value, String message) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

}

