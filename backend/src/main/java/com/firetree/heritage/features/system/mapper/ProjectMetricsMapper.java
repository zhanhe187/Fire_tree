package com.firetree.heritage.features.system.mapper;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ProjectMetricsMapper {

    private final MybatisSqlExecutor sqlExecutor;

    public ProjectMetricsMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> graphOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("nodeCount", countWhere("graph_nodes", "deleted = 0"));
        overview.put("edgeCount", countWhere("graph_edges", "deleted = 0"));
        overview.put("nodeTypeCount", count("graph_node_types"));
        overview.put("edgeTypeCount", count("graph_edge_types"));
        overview.put("tagCount", count("graph_tags"));
        overview.put("nodeTypes", listNodeTypes());
        overview.put("edgeTypes", listEdgeTypes());
        return overview;
    }

    public Map<String, Object> dashboardSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("roleCount", count("sys_roles"));
        summary.put("permissionCount", count("sys_permissions"));
        summary.put("riskRuleCount", count("risk_rules"));
        summary.put("pendingApplicationCount", countWhere("heritage_applications", "status = 'SUBMITTED'"));
        summary.put("openRiskReportCount", countWhere("risk_reports", "status = 'OPEN'"));
        summary.put("mediaFileCount", count("media_files"));
        summary.put("productCount", count("creative_products"));
        return summary;
    }

    private Integer count(String tableName) {
        return sqlExecutor.queryForObject("select count(*) from " + tableName, Integer.class);
    }

    private Integer countWhere(String tableName, String whereClause) {
        return sqlExecutor.queryForObject("select count(*) from " + tableName + " where " + whereClause, Integer.class);
    }

    private List<Map<String, Object>> listNodeTypes() {
        return sqlExecutor.queryForList("""
            select type_code as code, type_name as name, color, icon
            from graph_node_types
            where deleted = 0 and status = 1
            order by sort_order, id
            """);
    }

    private List<Map<String, Object>> listEdgeTypes() {
        return sqlExecutor.queryForList("""
            select type_code as code, type_name as name, inverse_name as inverseName, directed
            from graph_edge_types
            where deleted = 0 and status = 1
            order by id
            """);
    }
}

