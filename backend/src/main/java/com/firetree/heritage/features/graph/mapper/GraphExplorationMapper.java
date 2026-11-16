package com.firetree.heritage.features.graph.mapper;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class GraphExplorationMapper {

    private final MybatisSqlExecutor sqlExecutor;

    public GraphExplorationMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> visualization(String keyword, Long nodeTypeId, Long edgeTypeId, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> nodeParams = new ArrayList<>();
        String where = buildNodeWhere(keyword, nodeTypeId, nodeParams);

        Integer total = sqlExecutor.queryForObject("select count(*) from graph_nodes n where " + where, Integer.class, nodeParams.toArray());

        List<Object> pageParams = new ArrayList<>(nodeParams);
        pageParams.add((safePage - 1) * safeSize);
        pageParams.add(safeSize);
        List<Map<String, Object>> nodes = sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.summary,
              n.province,
              n.city,
              n.audit_status as auditStatus,
              t.type_code as nodeTypeCode,
              t.type_name as nodeTypeName,
              t.color as nodeTypeColor
            from graph_nodes n
            join graph_node_types t on t.id = n.node_type_id
            where %s
            order by n.updated_at desc, n.id desc
            limit ?, ?
            """.formatted(where), pageParams.toArray());

        List<Map<String, Object>> edges = nodes.isEmpty()
            ? List.of()
            : visualizationEdges(nodes, edgeTypeId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("nodeCount", nodes.size());
        result.put("edgeCount", edges.size());
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    /** 关系数最多的节点：图谱看板默认以它为中心展开，避免首屏全是孤立节点。 */
    public Map<String, Object> hubs(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              n.id,
              n.name,
              t.type_code as nodeTypeCode,
              t.type_name as nodeTypeName,
              count(*) as degree
            from (
              select source_node_id as node_id from graph_edges where deleted = 0 and status = 1
              union all
              select target_node_id as node_id from graph_edges where deleted = 0 and status = 1
            ) d
            join graph_nodes n on n.id = d.node_id and n.deleted = 0 and n.status = 1
            join graph_node_types t on t.id = n.node_type_id
            where n.audit_status = 'APPROVED' and n.visibility = 'PUBLIC'
            group by n.id, n.name, t.type_code, t.type_name
            order by degree desc, n.id asc
            limit ?
            """, safeLimit);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", items.size());
        result.put("items", items);
        return result;
    }

    public Map<String, Object> semanticSearch(String question) {
        String normalized = question == null ? "" : question.toLowerCase(Locale.ROOT);
        Map<String, Object> project = findMentionedProject(normalized);
        List<Map<String, Object>> chains = project.isEmpty()
            ? List.of()
            : findChains(project, wantsMaster(normalized));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("question", question);
        result.put("total", chains.size());
        result.put("chains", chains);
        return result;
    }

    private List<Map<String, Object>> visualizationEdges(List<Map<String, Object>> nodes, Long edgeTypeId) {
        List<Object> params = new ArrayList<>();
        List<Long> nodeIds = nodes.stream()
            .map(node -> ((Number) node.get("id")).longValue())
            .toList();
        String placeholders = nodeIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        params.addAll(nodeIds);
        params.addAll(nodeIds);

        String edgeTypeFilter = "";
        if (edgeTypeId != null) {
            edgeTypeFilter = " and e.edge_type_id = ?";
            params.add(edgeTypeId);
        }

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
            where e.deleted = 0 and e.status = 1
              and s.deleted = 0 and t.deleted = 0
              and e.source_node_id in (%s)
              and e.target_node_id in (%s)
              %s
            order by e.updated_at desc, e.id desc
            """.formatted(placeholders, placeholders, edgeTypeFilter), params.toArray());
    }

    private String buildNodeWhere(String keyword, Long nodeTypeId, List<Object> params) {
        StringBuilder where = new StringBuilder("n.deleted = 0 and n.status = 1");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (n.name like ? or n.alias like ? or n.summary like ? or n.node_code like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (nodeTypeId != null) {
            where.append(" and n.node_type_id = ?");
            params.add(nodeTypeId);
        }
        return where.toString();
    }

    private Map<String, Object> findMentionedProject(String question) {
        List<Map<String, Object>> projects = sqlExecutor.queryForList("""
            select n.id, n.node_code as nodeCode, n.name
            from graph_nodes n
            join graph_node_types t on t.id = n.node_type_id
            where n.deleted = 0 and n.status = 1 and t.type_code = 'heritage_project'
            order by length(n.node_code) desc, length(n.name) desc
            """);
        for (Map<String, Object> project : projects) {
            String code = String.valueOf(project.get("nodeCode")).toLowerCase(Locale.ROOT);
            String name = String.valueOf(project.get("name")).toLowerCase(Locale.ROOT);
            if (question.contains(code) || question.contains(name)) {
                return project;
            }
        }
        return Map.of();
    }

    private List<Map<String, Object>> findChains(Map<String, Object> project, boolean includeMaster) {
        String masterJoin = includeMaster ? """
            join graph_edges e2 on e2.source_node_id = i.id and e2.deleted = 0 and e2.status = 1
            join graph_edge_types et2 on et2.id = e2.edge_type_id and et2.type_code = 'inherited_from'
            join graph_nodes m on m.id = e2.target_node_id and m.deleted = 0 and m.status = 1
            """ : "";
        String masterSelect = includeMaster ? """
              e2.id as masterEdgeId,
              e2.relation_label as masterRelationLabel,
              m.id as masterId,
              m.node_code as masterCode,
              m.name as masterName
            """ : """
              null as masterEdgeId,
              null as masterRelationLabel,
              null as masterId,
              null as masterCode,
              null as masterName
            """;

        List<Map<String, Object>> rows = sqlExecutor.queryForList("""
            select
              p.id as projectId,
              p.node_code as projectCode,
              p.name as projectName,
              e1.id as inheritorEdgeId,
              e1.relation_label as inheritorRelationLabel,
              i.id as inheritorId,
              i.node_code as inheritorCode,
              i.name as inheritorName,
              %s
            from graph_nodes p
            join graph_edges e1 on e1.source_node_id = p.id and e1.deleted = 0 and e1.status = 1
            join graph_edge_types et1 on et1.id = e1.edge_type_id and et1.type_code = 'has_inheritor'
            join graph_nodes i on i.id = e1.target_node_id and i.deleted = 0 and i.status = 1
            %s
            where p.id = ? and p.deleted = 0 and p.status = 1
            order by i.id
            """.formatted(masterSelect, masterJoin), project.get("id"));

        return rows.stream()
            .map(row -> chainFromRow(row, includeMaster))
            .toList();
    }

    private Map<String, Object> chainFromRow(Map<String, Object> row, boolean includeMaster) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        nodes.add(node(row.get("projectId"), row.get("projectCode"), row.get("projectName"), "heritage_project"));
        nodes.add(node(row.get("inheritorId"), row.get("inheritorCode"), row.get("inheritorName"), "inheritor"));
        if (includeMaster && row.get("masterId") != null) {
            nodes.add(node(row.get("masterId"), row.get("masterCode"), row.get("masterName"), "inheritor"));
        }

        List<Map<String, Object>> edges = new ArrayList<>();
        edges.add(edge(row.get("inheritorEdgeId"), "has_inheritor", row.get("inheritorRelationLabel")));
        if (includeMaster && row.get("masterEdgeId") != null) {
            edges.add(edge(row.get("masterEdgeId"), "inherited_from", row.get("masterRelationLabel")));
        }

        Map<String, Object> chain = new LinkedHashMap<>();
        chain.put("title", includeMaster ? "Project inheritor master chain" : "Project inheritor chain");
        chain.put("nodes", nodes);
        chain.put("edges", edges);
        return chain;
    }

    private boolean wantsMaster(String question) {
        return question.contains("master") || question.contains("teacher") || question.contains("\u5e08\u7236") || question.contains("\u5e08\u627f");
    }

    private Map<String, Object> node(Object id, Object code, Object name, String typeCode) {
        Map<String, Object> node = new LinkedHashMap<>();
        node.put("id", id);
        node.put("nodeCode", code);
        node.put("name", name);
        node.put("nodeTypeCode", typeCode);
        return node;
    }

    private Map<String, Object> edge(Object id, String typeCode, Object label) {
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("id", id);
        edge.put("edgeTypeCode", typeCode);
        edge.put("relationLabel", label);
        return edge;
    }
}

