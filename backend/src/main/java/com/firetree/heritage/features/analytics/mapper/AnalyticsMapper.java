package com.firetree.heritage.features.analytics.mapper;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class AnalyticsMapper {

    private static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");

    private final MybatisSqlExecutor sqlExecutor;

    public AnalyticsMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> overview() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totals", totals());
        result.put("categoryShare", categoryShare());
        result.put("ageBuckets", ageBuckets());
        result.put("provinceHeatmap", provinceHeatmap());
        result.put("propagationTracks", propagationTracks());
        return result;
    }

    public Map<String, Object> searchHot(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              keyword,
              search_type as searchType,
              count(*) as searchCount,
              sum(result_count) as resultTotal,
              max(created_at) as lastSearchedAt
            from search_logs
            where created_at >= date_sub(current_timestamp, interval 30 day)
            group by keyword, search_type
            order by searchCount desc, lastSearchedAt desc
            limit ?
            """, safeLimit);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        return result;
    }

    public Map<String, Object> behaviorTrend(int days) {
        int safeDays = Math.min(Math.max(days, 1), 90);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              date(created_at) as date,
              behavior_type as behaviorType,
              target_type as targetType,
              count(*) as eventCount
            from user_behavior_logs
            where created_at >= date_sub(current_date, interval ? day)
            group by date(created_at), behavior_type, target_type
            order by date desc, eventCount desc
            """, safeDays);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("days", safeDays);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> operationAudit(String keyword, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = "1 = 1";
        if (keyword != null && !keyword.isBlank()) {
            where += " and (o.operation like ? or o.resource_type like ? or o.request_uri like ? or u.username like ? or u.nickname like ?)";
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from operation_logs o
            left join sys_users u on u.id = o.operator_id
            where %s
            """.formatted(where), Integer.class, params.toArray());
        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              o.id,
              o.operator_id as operatorId,
              u.username as operatorUsername,
              u.nickname as operatorName,
              o.operation,
              o.resource_type as resourceType,
              o.resource_id as resourceId,
              o.request_method as requestMethod,
              o.request_uri as requestUri,
              o.request_body as requestBody,
              o.success,
              o.error_message as errorMessage,
              o.created_at as createdAt
            from operation_logs o
            left join sys_users u on u.id = o.operator_id
            where %s
            order by o.created_at desc, o.id desc
            limit ?, ?
            """.formatted(where), params.toArray());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    private Map<String, Object> totals() {
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("nodeCount", count("""
            select count(*)
            from graph_nodes
            where deleted = 0 and status = 1 and visibility = 'PUBLIC' and audit_status = 'APPROVED'
            """));
        totals.put("provinceCount", count("""
            select count(distinct province)
            from graph_nodes
            where deleted = 0 and status = 1 and visibility = 'PUBLIC' and audit_status = 'APPROVED' and province is not null and province <> ''
            """));
        totals.put("trackCount", count("""
            select count(*)
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id
            where e.deleted = 0 and e.audit_status = 'APPROVED' and et.type_code in ('originated_in', 'located_in', 'spread_to')
            """));
        return totals;
    }

    private List<Map<String, Object>> categoryShare() {
        List<Map<String, Object>> rows = sqlExecutor.queryForList("""
            select
              nt.type_code as typeCode,
              nt.type_name as typeName,
              nt.color,
              count(*) as nodeCount
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
            group by nt.id, nt.type_code, nt.type_name, nt.color
            order by nodeCount desc, nt.sort_order, nt.id
            """);
        long total = rows.stream()
            .map(row -> (Number) row.get("nodeCount"))
            .mapToLong(Number::longValue)
            .sum();
        for (Map<String, Object> row : rows) {
            long count = ((Number) row.get("nodeCount")).longValue();
            row.put("percentage", total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(count * 100.0 / total).setScale(2, RoundingMode.HALF_UP));
        }
        return rows;
    }

    private List<Map<String, Object>> ageBuckets() {
        int currentYear = Year.now(CHINA_ZONE).getValue();
        List<Map<String, Object>> buckets = new ArrayList<>();
        buckets.add(bucket("0-19", 0, 19));
        buckets.add(bucket("20-39", 20, 39));
        buckets.add(bucket("40-59", 40, 59));
        buckets.add(bucket("60+", 60, 200));

        List<Integer> birthYears = sqlExecutor.queryForList("""
            select cast(json_unquote(json_extract(n.extra_attrs, '$.birthYear')) as unsigned) as birthYear
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id and nt.type_code = 'inheritor'
            where n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
              and json_extract(n.extra_attrs, '$.birthYear') is not null
            """, Integer.class);

        for (Integer birthYear : birthYears) {
            if (birthYear == null || birthYear <= 0 || birthYear > currentYear) {
                continue;
            }
            int age = currentYear - birthYear;
            for (Map<String, Object> bucket : buckets) {
                int minAge = ((Number) bucket.get("minAge")).intValue();
                int maxAge = ((Number) bucket.get("maxAge")).intValue();
                if (age >= minAge && age <= maxAge) {
                    bucket.put("nodeCount", ((Number) bucket.get("nodeCount")).intValue() + 1);
                    break;
                }
            }
        }
        return buckets;
    }

    private List<Map<String, Object>> provinceHeatmap() {
        return sqlExecutor.queryForList("""
            select
              n.province,
              count(*) as nodeCount,
              coalesce(round(avg(n.longitude), 6), 0) as longitude,
              coalesce(round(avg(n.latitude), 6), 0) as latitude,
              sum(n.popularity_count) as popularityTotal
            from graph_nodes n
            where n.deleted = 0
              and n.status = 1
              and n.visibility = 'PUBLIC'
              and n.audit_status = 'APPROVED'
              and n.province is not null
              and n.province <> ''
            group by n.province
            order by nodeCount desc, popularityTotal desc, n.province
            """);
    }

    private List<Map<String, Object>> propagationTracks() {
        return sqlExecutor.queryForList("""
            select
              e.id,
              et.type_code as edgeTypeCode,
              et.type_name as edgeTypeName,
              e.relation_label as relationLabel,
              s.id as sourceNodeId,
              s.node_code as sourceNodeCode,
              s.name as sourceNodeName,
              s.province as sourceProvince,
              s.city as sourceCity,
              s.longitude as sourceLongitude,
              s.latitude as sourceLatitude,
              t.id as targetNodeId,
              t.node_code as targetNodeCode,
              t.name as targetNodeName,
              t.province as targetProvince,
              t.city as targetCity,
              t.longitude as targetLongitude,
              t.latitude as targetLatitude
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id
            join graph_nodes s on s.id = e.source_node_id and s.deleted = 0 and s.status = 1
            join graph_nodes t on t.id = e.target_node_id and t.deleted = 0 and t.status = 1
            where e.deleted = 0
              and e.audit_status = 'APPROVED'
              and et.type_code in ('originated_in', 'located_in', 'spread_to')
            order by e.updated_at desc, e.id desc
            limit 30
            """);
    }

    private Map<String, Object> bucket(String label, int minAge, int maxAge) {
        Map<String, Object> bucket = new LinkedHashMap<>();
        bucket.put("label", label);
        bucket.put("minAge", minAge);
        bucket.put("maxAge", maxAge);
        bucket.put("nodeCount", 0);
        return bucket;
    }

    private Integer count(String sql) {
        Integer value = sqlExecutor.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }
}
