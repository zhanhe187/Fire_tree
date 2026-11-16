package com.firetree.heritage.features.favorite.mapper;

import com.firetree.heritage.features.favorite.dto.FavoriteNodeRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;

@Component
public class FavoriteMapper {

    private final MybatisSqlExecutor sqlExecutor;
    private final UserLookupMapper userLookupMapper;

    public FavoriteMapper(MybatisSqlExecutor sqlExecutor, UserLookupMapper userLookupMapper) {
        this.sqlExecutor = sqlExecutor;
        this.userLookupMapper = userLookupMapper;
    }

    public Map<String, Object> favorites(long userId, String keyword, int page, int size) {
        userLookupMapper.ensureUserExists(userId, "userId is invalid");
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        params.add(userId);
        String where = buildFavoriteWhere(keyword, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from favorite_nodes f
            join graph_nodes n on n.id = f.node_id
            where f.user_id = ? and %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              f.id,
              f.user_id as userId,
              f.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              n.summary,
              n.province,
              n.city,
              n.popularity_count as popularityCount,
              f.note,
              f.created_at as createdAt,
              f.updated_at as updatedAt
            from favorite_nodes f
            join graph_nodes n on n.id = f.node_id
            join graph_node_types nt on nt.id = n.node_type_id
            where f.user_id = ? and %s
            order by f.updated_at desc, f.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    @Transactional
    public Map<String, Object> favoriteNode(FavoriteNodeRequest request) {
        if (request.nodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is required");
        }
        long userId = userLookupMapper.resolveUserId(request.userId(), request.username(), "username");
        ensureAccessibleNode(request.nodeId());

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into favorite_nodes (user_id, node_id, note)
                values (?, ?, ?)
                """,
                userId,
                request.nodeId(),
                blankToNull(request.note())
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Node already favorited");
        }

        return favoriteById(id);
    }

    @Transactional
    public Map<String, Object> updateNote(long nodeId, FavoriteNodeRequest request) {
        long userId = userLookupMapper.resolveUserId(request.userId(), request.username(), "username");
        ensureFavoriteExists(userId, nodeId);
        sqlExecutor.update("""
            update favorite_nodes
            set note = ?
            where user_id = ? and node_id = ?
            """, blankToNull(request.note()), userId, nodeId);
        return favoriteByUserAndNode(userId, nodeId);
    }

    @Transactional
    public void unfavoriteNode(long userId, long nodeId) {
        userLookupMapper.ensureUserExists(userId, "userId is invalid");
        sqlExecutor.update("delete from favorite_nodes where user_id = ? and node_id = ?", userId, nodeId);
    }

    public Map<String, Object> personalGraph(long userId) {
        userLookupMapper.ensureUserExists(userId, "userId is invalid");
        List<Map<String, Object>> favoriteNodes = favoriteGraphNodes(userId);
        if (favoriteNodes.isEmpty()) {
            return graphResult(List.of(), List.of());
        }

        List<Long> favoriteNodeIds = favoriteNodes.stream()
            .map(node -> ((Number) node.get("id")).longValue())
            .toList();
        String placeholders = favoriteNodeIds.stream().map(id -> "?").collect(Collectors.joining(", "));

        List<Map<String, Object>> neighborNodes = sqlExecutor.queryForList("""
            select distinct
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.summary,
              n.province,
              n.city,
              n.audit_status as auditStatus,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              false as favorited
            from graph_edges e
            join graph_nodes n on n.id = case
              when e.source_node_id in (%s) then e.target_node_id
              else e.source_node_id
            end
            join graph_node_types nt on nt.id = n.node_type_id
            where e.deleted = 0
              and e.status = 1
              and e.audit_status = 'APPROVED'
              and (e.source_node_id in (%s) or e.target_node_id in (%s))
              and n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
            order by n.id desc
            """.formatted(placeholders, placeholders, placeholders), graphParams(favoriteNodeIds, 3));

        Map<Long, Map<String, Object>> nodesById = new LinkedHashMap<>();
        for (Map<String, Object> node : favoriteNodes) {
            nodesById.put(((Number) node.get("id")).longValue(), node);
        }
        for (Map<String, Object> node : neighborNodes) {
            nodesById.putIfAbsent(((Number) node.get("id")).longValue(), node);
        }

        List<Long> visibleNodeIds = new ArrayList<>(nodesById.keySet());
        List<Map<String, Object>> edges = visibleNodeIds.size() < 2 ? List.of() : graphEdges(visibleNodeIds);
        return graphResult(new ArrayList<>(nodesById.values()), edges);
    }

    private Map<String, Object> graphResult(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("nodeCount", nodes.size());
        result.put("edgeCount", edges.size());
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    private List<Map<String, Object>> favoriteGraphNodes(long userId) {
        return sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.summary,
              n.province,
              n.city,
              n.audit_status as auditStatus,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              true as favorited,
              f.note
            from favorite_nodes f
            join graph_nodes n on n.id = f.node_id
            join graph_node_types nt on nt.id = n.node_type_id
            where f.user_id = ?
              and n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
            order by f.updated_at desc, f.id desc
            """, userId);
    }

    private List<Map<String, Object>> graphEdges(List<Long> nodeIds) {
        String placeholders = nodeIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        return sqlExecutor.queryForList("""
            select
              e.id,
              e.source_node_id as sourceNodeId,
              s.node_code as sourceNodeCode,
              s.name as sourceNodeName,
              e.target_node_id as targetNodeId,
              t.node_code as targetNodeCode,
              t.name as targetNodeName,
              et.type_code as edgeTypeCode,
              et.type_name as edgeTypeName,
              e.directed,
              e.weight,
              e.relation_label as relationLabel,
              e.audit_status as auditStatus
            from graph_edges e
            join graph_nodes s on s.id = e.source_node_id
            join graph_nodes t on t.id = e.target_node_id
            join graph_edge_types et on et.id = e.edge_type_id
            where e.deleted = 0
              and e.status = 1
              and e.audit_status = 'APPROVED'
              and e.source_node_id in (%s)
              and e.target_node_id in (%s)
              and s.deleted = 0 and s.status = 1 and s.visibility = 'PUBLIC' and s.audit_status = 'APPROVED'
              and t.deleted = 0 and t.status = 1 and t.visibility = 'PUBLIC' and t.audit_status = 'APPROVED'
            order by e.updated_at desc, e.id desc
            """.formatted(placeholders, placeholders), graphParams(nodeIds, 2));
    }

    private Object[] graphParams(List<Long> nodeIds, int repeat) {
        List<Object> params = new ArrayList<>();
        for (int i = 0; i < repeat; i++) {
            params.addAll(nodeIds);
        }
        return params.toArray();
    }

    private Map<String, Object> favoriteById(long id) {
        return sqlExecutor.queryForMap("""
            select
              f.id,
              f.user_id as userId,
              f.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              n.summary,
              n.province,
              n.city,
              n.popularity_count as popularityCount,
              f.note,
              f.created_at as createdAt,
              f.updated_at as updatedAt
            from favorite_nodes f
            join graph_nodes n on n.id = f.node_id
            join graph_node_types nt on nt.id = n.node_type_id
            where f.id = ?
            """, id);
    }

    private Map<String, Object> favoriteByUserAndNode(long userId, long nodeId) {
        return sqlExecutor.queryForMap("""
            select
              f.id,
              f.user_id as userId,
              f.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              n.summary,
              n.province,
              n.city,
              n.popularity_count as popularityCount,
              f.note,
              f.created_at as createdAt,
              f.updated_at as updatedAt
            from favorite_nodes f
            join graph_nodes n on n.id = f.node_id
            join graph_node_types nt on nt.id = n.node_type_id
            where f.user_id = ? and f.node_id = ?
            """, userId, nodeId);
    }

    private String buildFavoriteWhere(String keyword, List<Object> params) {
        StringBuilder where = new StringBuilder("""
            n.deleted = 0
            and n.status = 1
            and n.visibility = 'PUBLIC'
            and n.audit_status = 'APPROVED'
            """);
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (n.name like ? or n.node_code like ? or n.summary like ? or f.note like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        return where.toString();
    }

    private void ensureFavoriteExists(long userId, long nodeId) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from favorite_nodes where user_id = ? and node_id = ?",
            Integer.class,
            userId,
            nodeId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite not found");
        }
    }

    private void ensureAccessibleNode(long nodeId) {
        try {
            sqlExecutor.queryForObject("""
                select id
                from graph_nodes
                where id = ?
                  and deleted = 0
                  and status = 1
                  and visibility = 'PUBLIC'
                  and audit_status = 'APPROVED'
                """, Long.class, nodeId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is invalid");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
