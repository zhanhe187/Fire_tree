package com.firetree.heritage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 浏览页检索契约：keyword 必须同时覆盖名称/别名/简介/编码与地区字段，
 * 否则页面标题承诺的「按地区看」无法兑现（搜「长沙」什么都搜不到）。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class GraphNodeSearchApiTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    @AfterEach
    void cleanupSearchTestNodes() {
        jdbcTemplate.update("delete from graph_nodes where node_code like 'test_search_%'");
    }

    @Test
    void keywordMatchesProvinceAndCityAsWellAsName() {
        // 用 ASCII 地区值隔离 URL 编码因素，只验证 SQL 匹配范围。
        long nodeId = insertNode("test_search_region_node", "T31 地区检索节点", "TestProvince", "TestCity");

        Map<String, Object> byProvince = search("TestProvince");
        assertThat(items(byProvince))
            .as("按省份关键词应命中节点")
            .extracting(item -> ((Number) item.get("id")).longValue())
            .contains(nodeId);

        Map<String, Object> byCity = search("TestCity");
        assertThat(items(byCity))
            .as("按城市关键词应命中节点")
            .extracting(item -> ((Number) item.get("id")).longValue())
            .contains(nodeId);

        Map<String, Object> byName = search("地区检索节点");
        assertThat(items(byName))
            .as("按名称检索的既有行为必须保留")
            .extracting(item -> ((Number) item.get("id")).longValue())
            .contains(nodeId);

        Map<String, Object> noMatch = search("zzz-no-such-keyword");
        assertThat(((Number) noMatch.get("total")).intValue()).isZero();
    }

    private long insertNode(String code, String name, String province, String city) {
        long typeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );
        jdbcTemplate.update("""
            insert into graph_nodes (node_code, node_type_id, name, province, city, audit_status)
            values (?, ?, ?, ?, ?, 'APPROVED')
            """, code, typeId, name, province, city);
        return jdbcTemplate.queryForObject("select id from graph_nodes where node_code = ?", Long.class, code);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> search(String keyword) {
        String encoded = java.net.URLEncoder.encode(keyword, java.nio.charset.StandardCharsets.UTF_8);
        // 传 URI（而非 String）避免 RestTemplate 把已编码的 %XX 再编码一次。
        java.net.URI uri = java.net.URI.create(
            "http://localhost:" + port + "/api/graph/nodes?keyword=" + encoded + "&page=1&size=50"
        );
        return restTemplate.exchange(uri, org.springframework.http.HttpMethod.GET, null, Map.class).getBody();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> items(Map<String, Object> response) {
        assertThat(response).isNotNull();
        return (List<Map<String, Object>>) response.get("items");
    }
}
