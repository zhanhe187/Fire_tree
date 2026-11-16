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

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 图谱看板「中心节点展开」依赖的邻居接口契约：
 * 返回的边必须两端都在返回的节点集里（否则前端要么画不出线，要么画出悬空线），
 * depth 决定跳数，limit 决定节点上限。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class GraphBoardRelationsApiTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    @AfterEach
    void cleanupBoardTestData() {
        jdbcTemplate.update("""
            delete from graph_edges
            where source_node_id in (select id from graph_nodes where node_code like 'test_board_%')
               or target_node_id in (select id from graph_nodes where node_code like 'test_board_%')
            """);
        jdbcTemplate.update("delete from graph_nodes where node_code like 'test_board_%'");
    }

    @Test
    void relationsReturnConnectedNodesAndOnlyInSetEdges() {
        long a = insertNode("test_board_a", "T32 中心节点");
        long b = insertNode("test_board_b", "T32 一跳邻居");
        long c = insertNode("test_board_c", "T32 二跳邻居");
        long d = insertNode("test_board_d", "T32 三跳之外");
        long edgeTypeId = firstEdgeTypeId();
        insertEdge(a, b, edgeTypeId, "测试关系1");
        insertEdge(b, c, edgeTypeId, "测试关系2");
        insertEdge(c, d, edgeTypeId, "测试关系3");

        Map<String, Object> oneHop = relations(a, 1, 50);
        assertThat(intValue(oneHop, "nodeCount"))
            .as("1 跳只应返回中心节点与直接邻居")
            .isEqualTo(2);
        assertThat(intValue(oneHop, "edgeCount")).isEqualTo(1);
        assertEdgesInsideNodes(oneHop);

        Map<String, Object> twoHops = relations(a, 2, 50);
        assertThat(intValue(twoHops, "nodeCount")).isEqualTo(3);
        assertThat(intValue(twoHops, "edgeCount")).isEqualTo(2);
        assertEdgesInsideNodes(twoHops);

        Map<String, Object> limited = relations(a, 2, 2);
        assertThat(intValue(limited, "nodeCount"))
            .as("limit 必须真的限制节点数")
            .isLessThanOrEqualTo(2);
        assertEdgesInsideNodes(limited);
    }

    @Test
    void hubsExposeTheMostConnectedNodesForTheDefaultCenter() {
        // 15 条边，确保无论种子数据如何都排进前 20（当前库里最大度数是 13）。
        long center = insertNode("test_board_hub", "T32 枢纽节点");
        long edgeTypeId = firstEdgeTypeId();
        for (int index = 1; index <= 15; index += 1) {
            long neighbor = insertNode("test_board_hub_" + index, "T32 枢纽邻居" + index);
            insertEdge(center, neighbor, edgeTypeId, "枢纽关系" + index);
        }

        Map<String, Object> hubs = restTemplate.getForObject(
            "http://localhost:" + port + "/api/graph/hubs?limit=20",
            Map.class
        );
        assertThat(hubs).isNotNull();
        List<Map<String, Object>> items = castItems(hubs.get("items"));
        assertThat(items).isNotEmpty();

        Map<String, Object> ours = items.stream()
            .filter(item -> ((Number) item.get("id")).longValue() == center)
            .findFirst()
            .orElseThrow();
        assertThat(((Number) ours.get("degree")).intValue())
            .as("枢纽节点的度数应等于它的边数")
            .isEqualTo(15);

        int previous = Integer.MAX_VALUE;
        for (Map<String, Object> item : items) {
            int degree = ((Number) item.get("degree")).intValue();
            assertThat(degree)
                .as("枢纽列表必须按关系数降序")
                .isLessThanOrEqualTo(previous);
            previous = degree;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castItems(Object value) {
        return value instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
    }

    private long insertNode(String code, String name) {
        long typeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );
        jdbcTemplate.update("""
            insert into graph_nodes (node_code, node_type_id, name, audit_status)
            values (?, ?, ?, 'APPROVED')
            """, code, typeId, name);
        return jdbcTemplate.queryForObject("select id from graph_nodes where node_code = ?", Long.class, code);
    }

    private long firstEdgeTypeId() {
        return jdbcTemplate.queryForObject(
            "select id from graph_edge_types where deleted = 0 and status = 1 order by id limit 1",
            Long.class
        );
    }

    private void insertEdge(long sourceId, long targetId, long edgeTypeId, String label) {
        jdbcTemplate.update("""
            insert into graph_edges (source_node_id, target_node_id, edge_type_id, directed, relation_label, audit_status)
            values (?, ?, ?, 1, ?, 'APPROVED')
            """, sourceId, targetId, edgeTypeId, label);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> relations(long nodeId, int depth, int limit) {
        return restTemplate.getForObject(
            "http://localhost:" + port + "/api/graph/nodes/" + nodeId
                + "/relations?depth=" + depth + "&direction=both&limit=" + limit,
            Map.class
        );
    }

    private int intValue(Map<String, Object> payload, String key) {
        assertThat(payload).isNotNull();
        return ((Number) payload.get(key)).intValue();
    }

    @SuppressWarnings("unchecked")
    private void assertEdgesInsideNodes(Map<String, Object> payload) {
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) payload.get("nodes");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) payload.get("edges");
        Set<Long> nodeIds = new HashSet<>();
        nodes.forEach(node -> nodeIds.add(((Number) node.get("id")).longValue()));
        for (Map<String, Object> edge : edges) {
            long sourceId = ((Number) edge.get("sourceNodeId")).longValue();
            long targetId = ((Number) edge.get("targetNodeId")).longValue();
            assertThat(nodeIds)
                .as("边 %s 的端点必须出现在返回节点集中，否则前端会画出悬空连线", edge.get("id"))
                .contains(sourceId, targetId);
        }
    }
}
