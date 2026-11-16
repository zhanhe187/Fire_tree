package com.firetree.heritage.features.governance.mapper;

import com.firetree.heritage.features.governance.dto.RiskResolveRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class RiskReportMapper {

    private static final List<String> VALID_SEVERITY = List.of("LOW", "MEDIUM", "HIGH");
    private static final List<String> VALID_STATUS = List.of("OPEN", "IGNORED", "RESOLVED");

    private final MybatisSqlExecutor sqlExecutor;

    public RiskReportMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    @Transactional
    public Map<String, Object> scan() {
        int scannedCount = 0;
        int generatedCount = 0;

        Map<String, Object> noInheritorRule = ensureRule(
            "NO_INHERITOR_FOR_PROJECT",
            "\u975e\u9057\u9879\u76ee\u65e0\u4f20\u627f\u4eba",
            "\u975e\u9057\u9879\u76ee\u6ca1\u6709\u767b\u8bb0\u4efb\u4f55\u4f20\u627f\u4eba\u8282\u70b9\u65f6\u751f\u6210\u98ce\u9669\u62a5\u544a",
            "NO_INHERITOR",
            "HIGH"
        );
        List<Map<String, Object>> riskyProjects = sqlExecutor.queryForList("""
            select n.id, n.node_code as nodeCode, n.name
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id and nt.type_code = 'heritage_project'
            where n.deleted = 0 and n.status = 1
              and not exists (
                select 1
                from graph_edges e
                join graph_edge_types et on et.id = e.edge_type_id and et.type_code = 'has_inheritor'
                join graph_nodes target on target.id = e.target_node_id and target.deleted = 0 and target.status = 1
                where e.source_node_id = n.id and e.deleted = 0 and e.status = 1
              )
            order by n.id
            """);
        scannedCount += riskyProjects.size();
        for (Map<String, Object> project : riskyProjects) {
            generatedCount += insertRiskIfMissing(
                noInheritorRule,
                project.get("id"),
                null,
                project.get("name") + "\u6682\u672a\u767b\u8bb0\u4f20\u627f\u4eba",
                "\u8be5\u975e\u9057\u9879\u76ee\u5c1a\u672a\u5efa\u7acb\u6709\u6548\u7684\u201c\u62e5\u6709\u4f20\u627f\u4eba\u201d\u5173\u7cfb\uff0c\u8bf7\u8865\u5145\u4f20\u627f\u4eba\u8282\u70b9\u6216\u5b8c\u5584\u5173\u7cfb\u94fe\u8def\u3002"
            );
        }

        Map<String, Object> conflictRule = ensureRule(
            "CONFLICTING_INHERITANCE_EDGE",
            "\u4f20\u627f\u4eba\u5e08\u627f\u5173\u7cfb\u51b2\u7a81",
            "\u540c\u4e00\u4f20\u627f\u4eba\u5b58\u5728\u591a\u4e2a\u5e08\u627f\u6765\u6e90\u65f6\u751f\u6210\u51b2\u7a81\u98ce\u9669\u62a5\u544a",
            "CONFLICT",
            "HIGH"
        );
        Map<String, Object> duplicatedRule = ensureRule(
            "DUPLICATED_INHERITANCE_CHAIN",
            "\u91cd\u590d\u4f20\u627f\u94fe\u8def\u98ce\u9669",
            "\u540c\u4e00\u4f20\u627f\u4eba\u5b58\u5728\u591a\u6761\u5e08\u627f\u94fe\u8def\u65f6\u751f\u6210\u91cd\u590d\u94fe\u8def\u98ce\u9669\u62a5\u544a",
            "CONFLICT",
            "MEDIUM"
        );
        List<Map<String, Object>> conflictedInheritors = sqlExecutor.queryForList("""
            select child.id, child.name, min(e.id) as edgeId, count(distinct e.target_node_id) as masterCount
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id and et.type_code = 'inherited_from'
            join graph_nodes child on child.id = e.source_node_id and child.deleted = 0 and child.status = 1
            join graph_nodes master on master.id = e.target_node_id and master.deleted = 0 and master.status = 1
            where e.deleted = 0 and e.status = 1
            group by child.id, child.name
            having count(distinct e.target_node_id) > 1
            """);
        scannedCount += conflictedInheritors.size();
        for (Map<String, Object> row : conflictedInheritors) {
            generatedCount += insertRiskIfMissing(
                conflictRule,
                row.get("id"),
                row.get("edgeId"),
                row.get("name") + "\u5b58\u5728\u591a\u4e2a\u5e08\u627f\u6765\u6e90",
                "\u540c\u4e00\u4f20\u627f\u4eba\u88ab\u767b\u8bb0\u4e3a\u540c\u65f6\u5e08\u627f\u591a\u4e2a\u6765\u6e90\uff0c\u8bf7\u6838\u5bf9\u5e08\u5f92\u8c31\u7cfb\u3001\u6765\u6e90\u8bc1\u636e\u548c\u5173\u7cfb\u65b9\u5411\u3002"
            );
            generatedCount += insertRiskIfMissing(
                duplicatedRule,
                row.get("id"),
                row.get("edgeId"),
                row.get("name") + "\u5b58\u5728\u91cd\u590d\u4f20\u627f\u94fe\u8def",
                "\u8be5\u4f20\u627f\u4eba\u5b58\u5728\u591a\u6761\u5e08\u627f\u94fe\u8def\uff0c\u53ef\u80fd\u9020\u6210\u8c31\u7cfb\u91cd\u590d\u6216\u51b2\u7a81\u5c55\u793a\uff0c\u8bf7\u5408\u5e76\u91cd\u590d\u8bc1\u636e\u6216\u4fdd\u7559\u6743\u5a01\u94fe\u8def\u3002"
            );
        }
        Map<String, Object> agingRule = ensureRule(
            "AGING_INHERITOR_NO_SUCCESSOR",
            "\u9ad8\u9f84\u4f20\u627f\u4eba\u7f3a\u5c11\u540e\u7ee7",
            "\u4f20\u627f\u4eba\u5e74\u9f84\u8fbe\u5230\u9ad8\u9f84\u9608\u503c\u4e14\u6ca1\u6709\u5f1f\u5b50\u5173\u7cfb\u65f6\u751f\u6210\u540e\u7ee7\u98ce\u9669\u62a5\u544a",
            "NO_APPRENTICE",
            "HIGH"
        );
        int currentYear = Year.now().getValue();
        List<Map<String, Object>> agingRows = sqlExecutor.queryForList("""
            select n.id, n.name
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id and nt.type_code = 'inheritor'
            where n.deleted = 0 and n.status = 1
              and json_extract(n.extra_attrs, '$.birthYear') is not null
              and (? - cast(json_unquote(json_extract(n.extra_attrs, '$.birthYear')) as unsigned)) >= 60
              and not exists (
                select 1
                from graph_edges e
                join graph_edge_types et on et.id = e.edge_type_id and et.type_code = 'inherited_from'
                join graph_nodes apprentice on apprentice.id = e.source_node_id and apprentice.deleted = 0 and apprentice.status = 1
                where e.target_node_id = n.id and e.deleted = 0 and e.status = 1
              )
            """, currentYear);
        scannedCount += agingRows.size();
        for (Map<String, Object> row : agingRows) {
            generatedCount += insertRiskIfMissing(
                agingRule,
                row.get("id"),
                null,
                row.get("name") + "\u7f3a\u5c11\u540e\u7ee7\u4f20\u627f\u4eba",
                "\u8be5\u4f20\u627f\u4eba\u5df2\u8fbe\u5230\u9ad8\u9f84\u98ce\u9669\u9608\u503c\uff0c\u56fe\u8c31\u4e2d\u5c1a\u672a\u767b\u8bb0\u5f1f\u5b50\u6216\u540e\u7ee7\u5173\u7cfb\uff0c\u8bf7\u8865\u5145\u540e\u7ee7\u4f20\u627f\u7ebf\u7d22\u3002"
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scannedCount", scannedCount);
        result.put("generatedCount", generatedCount);
        result.put("openCount", openCount());
        return result;
    }

    public Map<String, Object> reports(String keyword, String severity, String status, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, severity, status, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from risk_reports r
            join risk_rules rr on rr.id = r.rule_id
            left join graph_nodes n on n.id = r.node_id
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              r.id,
              rr.rule_code as ruleCode,
              rr.rule_name as ruleName,
              r.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              r.title,
              r.description,
              r.severity,
              r.status,
              r.detected_at as detectedAt,
              r.resolved_at as resolvedAt,
              r.resolver_id as resolverId,
              r.resolver_note as resolverNote
            from risk_reports r
            join risk_rules rr on rr.id = r.rule_id
            left join graph_nodes n on n.id = r.node_id
            where %s
            order by field(r.severity, 'HIGH', 'MEDIUM', 'LOW'), r.detected_at desc, r.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        result.put("summary", summary());
        return result;
    }

    @Transactional
    public Map<String, Object> resolve(long id, RiskResolveRequest request, long resolverId) {
        String decision = normalizeResolveDecision(request.decision());
        int updated = sqlExecutor.update("""
            update risk_reports
            set status = ?, resolved_at = current_timestamp, resolver_id = ?, resolver_note = ?
            where id = ? and status = 'OPEN'
            """, decision, resolverId, blankToNull(request.comment()), id);
        if (updated == 0) {
            ensureReportExists(id);
            // 报告已不是 OPEN（已被处理过）：必须报错，否则前端会以为处理成功
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Risk report is already resolved");
        }
        return getReport(id);
    }

    private String buildWhere(String keyword, String severity, String status, List<Object> params) {
        StringBuilder where = new StringBuilder("1 = 1");
        if (keyword != null && !keyword.isBlank()) {
            where.append("""
                 and (
                  r.title like ? or r.description like ? or rr.rule_code like ? or rr.rule_name like ? or
                  n.node_code like ? or n.name like ?
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
        if (severity != null && !severity.isBlank()) {
            String normalized = severity.trim().toUpperCase();
            if (!VALID_SEVERITY.contains(normalized)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "severity is invalid");
            }
            where.append(" and r.severity = ?");
            params.add(normalized);
        }
        if (status != null && !status.isBlank()) {
            String normalized = status.trim().toUpperCase();
            if (!VALID_STATUS.contains(normalized)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
            }
            where.append(" and r.status = ?");
            params.add(normalized);
        }
        return where.toString();
    }

    private Map<String, Object> ensureRule(String ruleCode, String ruleName, String description, String ruleType, String severity) {
        sqlExecutor.update("""
            insert into risk_rules (rule_code, rule_name, description, rule_type, rule_config, severity)
            values (?, ?, ?, ?, json_object(), ?)
            on duplicate key update
              rule_name = values(rule_name),
              description = values(description),
              rule_type = values(rule_type),
              severity = values(severity),
              status = 1,
              deleted = 0
            """, ruleCode, ruleName, description, ruleType, severity);
        return rule(ruleCode);
    }

    private Map<String, Object> rule(String ruleCode) {
        try {
            return sqlExecutor.queryForMap("""
                select id, rule_code as ruleCode, rule_name as ruleName, severity
                from risk_rules
                where rule_code = ? and deleted = 0 and status = 1
                """, ruleCode);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Risk rule is missing", exception);
        }
    }

    private int insertRiskIfMissing(Map<String, Object> rule, Object nodeId, Object edgeId, String title, String description) {
        if (hasOpenReport(rule.get("id"), nodeId)) {
            return 0;
        }
        sqlExecutor.update("""
            insert into risk_reports (rule_id, node_id, edge_id, title, description, severity, status)
            values (?, ?, ?, ?, ?, ?, 'OPEN')
            """,
            rule.get("id"),
            nodeId,
            edgeId,
            title,
            description,
            rule.get("severity")
        );
        return 1;
    }

    private boolean hasOpenReport(Object ruleId, Object nodeId) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from risk_reports where rule_id = ? and node_id = ? and status = 'OPEN'",
            Integer.class,
            ruleId,
            nodeId
        );
        return count != null && count > 0;
    }

    private int openCount() {
        Integer count = sqlExecutor.queryForObject("select count(*) from risk_reports where status = 'OPEN'", Integer.class);
        return count == null ? 0 : count;
    }

    private Map<String, Object> summary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("open", countWhere("status = 'OPEN'"));
        summary.put("high", countWhere("status = 'OPEN' and severity = 'HIGH'"));
        summary.put("pending", countWhere("status = 'OPEN'"));
        summary.put("resolved", countWhere("status = 'RESOLVED'"));
        return summary;
    }

    private int countWhere(String where) {
        Integer count = sqlExecutor.queryForObject("select count(*) from risk_reports where " + where, Integer.class);
        return count == null ? 0 : count;
    }

    private void ensureReportExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from risk_reports where id = ?", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Risk report not found");
        }
    }

    private Map<String, Object> getReport(long id) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  r.id,
                  rr.rule_code as ruleCode,
                  rr.rule_name as ruleName,
                  r.node_id as nodeId,
                  n.node_code as nodeCode,
                  n.name as nodeName,
                  r.title,
                  r.description,
                  r.severity,
                  r.status,
                  r.detected_at as detectedAt,
                  r.resolved_at as resolvedAt,
                  r.resolver_id as resolverId,
                  r.resolver_note as resolverNote
                from risk_reports r
                join risk_rules rr on rr.id = r.rule_id
                left join graph_nodes n on n.id = r.node_id
                where r.id = ?
                """, id);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Risk report not found", exception);
        }
    }

    private String normalizeResolveDecision(String value) {
        String normalized = value == null || value.isBlank() ? "RESOLVED" : value.trim().toUpperCase();
        if (!List.of("RESOLVED", "IGNORED").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision is invalid");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
