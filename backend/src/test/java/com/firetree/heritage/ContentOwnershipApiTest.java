package com.firetree.heritage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ContentOwnershipApiTest {

    private String scopePrefix;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void initializeScope() {
        scopePrefix = "scope_ownership_" + UUID.randomUUID().toString().substring(0, 12) + "_";
        restTemplate.getRestTemplate().setRequestFactory(new org.springframework.http.client.JdkClientHttpRequestFactory());
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("delete from operation_logs where operator_id in (select id from sys_users where username like ?)", scopePrefix + "%");
        List<Long> exhibitionIds = jdbcTemplate.queryForList(
            "select id from exhibitions where title like ?", Long.class, scopePrefix + "%"
        );
        for (Long exhibitionId : exhibitionIds) {
            List<Long> graphNodeIds = jdbcTemplate.queryForList(
                "select id from graph_nodes where node_code = ?", Long.class, "exhibition_" + exhibitionId
            );
            for (Long graphNodeId : graphNodeIds) {
                jdbcTemplate.update("delete from graph_edges where source_node_id = ? or target_node_id = ?", graphNodeId, graphNodeId);
                jdbcTemplate.update("delete from graph_nodes where id = ?", graphNodeId);
            }
        }
        jdbcTemplate.update("delete from news_articles where title like ?", scopePrefix + "%");
        jdbcTemplate.update("delete from exhibitions where title like ?", scopePrefix + "%");
        jdbcTemplate.update("delete from product_reviews where product_id in (select id from creative_products where product_code like ?)", scopePrefix + "%");
        jdbcTemplate.update("delete from creative_products where product_code like ?", scopePrefix + "%");
        jdbcTemplate.update("delete from sys_user_roles where user_id in (select id from sys_users where username like ?)", scopePrefix + "%");
        jdbcTemplate.update("delete from sys_users where username like ?", scopePrefix + "%");
    }

    @Test
    void inheritorBackstageProductsContainOnlyTheirOwnedResources() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = getAs(owners.inheritorAToken(), "/api/products?backstage=true&page=1&size=100");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(response, owners.productA(), owners.productB())).containsExactly(owners.productA());
    }

    @Test
    void inheritorBackstageArticlesContainOnlyTheirAuthoredResources() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = getAs(owners.inheritorAToken(), "/api/articles?backstage=true&page=1&size=100");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(response, owners.articleA(), owners.articleB())).containsExactly(owners.articleA());
    }

    @Test
    void inheritorBackstageExhibitionsContainOnlyTheirCreatedResources() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = getAs(owners.inheritorAToken(), "/api/exhibitions?backstage=true&page=1&size=100");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(response, owners.exhibitionA(), owners.exhibitionB())).containsExactly(owners.exhibitionA());
    }

    @Test
    void superAdminBackstageQueriesContainBothOwnersResources() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> products = getAs(owners.adminToken(), "/api/products?backstage=true&page=1&size=100");
        ResponseEntity<Map> articles = getAs(owners.adminToken(), "/api/articles?backstage=true&page=1&size=100");
        ResponseEntity<Map> exhibitions = getAs(owners.adminToken(), "/api/exhibitions?backstage=true&page=1&size=100");

        assertThat(products.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(products, owners.productA(), owners.productB())).containsExactlyInAnyOrder(owners.productA(), owners.productB());
        assertThat(articles.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(articles, owners.articleA(), owners.articleB())).containsExactlyInAnyOrder(owners.articleA(), owners.articleB());
        assertThat(exhibitions.getStatusCode().value()).isEqualTo(200);
        assertThat(scopedIds(exhibitions, owners.exhibitionA(), owners.exhibitionB())).containsExactlyInAnyOrder(owners.exhibitionA(), owners.exhibitionB());
    }

    @Test
    void productReviewRequiresAuthentication() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = restTemplate.exchange(
            url("/api/products/" + owners.productA() + "/reviews"),
            HttpMethod.POST,
            new HttpEntity<>(Map.of("rating", 5, "content", "anonymous review"), new HttpHeaders()),
            Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void productReviewUsesAuthenticatedUserInsteadOfSpoofedBodyUser() {
        Owners owners = seedOwnersAndContent();
        long reviewerId = ensureUser(scopePrefix + "reviewer", "NORMAL", "NORMAL_USER");
        long spoofedUserId = jdbcTemplate.queryForObject(
            "select id from sys_users where username = ?", Long.class, scopePrefix + "inheritor_a"
        );

        ResponseEntity<Map> response = exchangeAs(
            loginToken(scopePrefix + "reviewer"),
            HttpMethod.POST,
            "/api/products/" + owners.productA() + "/reviews",
            Map.of("userId", spoofedUserId, "username", scopePrefix + "inheritor_a", "rating", 5, "content", "honest review")
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(((Number) response.getBody().get("userId")).longValue()).isEqualTo(reviewerId);
    }

    @Test
    void portalProductDetailHidesUnpublishedProduct() {
        Owners owners = seedOwnersAndContent();
        jdbcTemplate.update("update creative_products set status = 'DRAFT' where id = ?", owners.productA());

        ResponseEntity<Map> response = restTemplate.getForEntity(
            url("/api/products/" + owners.productA()), Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void portalArticleDetailHidesUnpublishedArticle() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = restTemplate.getForEntity(
            url("/api/articles/" + owners.articleA()), Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void portalExhibitionDetailHidesUnpublishedExhibition() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> response = restTemplate.getForEntity(
            url("/api/exhibitions/" + owners.exhibitionA()), Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void creatingExhibitionSyncsGraphNodeWithExhibitionMarketType() {
        ensureUser(scopePrefix + "inheritor_a", "INHERITOR", "INHERITOR");

        ResponseEntity<Map> response = exchangeAs(
            loginToken(scopePrefix + "inheritor_a"),
            HttpMethod.POST,
            "/api/exhibitions",
            Map.of("title", scopePrefix + "exhibition_graph_sync", "status", "DRAFT")
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        long exhibitionId = ((Number) response.getBody().get("id")).longValue();
        Map<String, Object> node = jdbcTemplate.queryForMap("""
            select t.type_code as typeCode
            from graph_nodes n
            join graph_node_types t on t.id = n.node_type_id
            where n.node_code = ?
            """, "exhibition_" + exhibitionId);
        assertThat(node.get("typeCode")).isEqualTo("exhibition_market");
    }

    @Test
    void inheritorCannotUpdateAnotherOwnersArticle() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> article = exchangeAs(
            owners.inheritorAToken(), HttpMethod.PUT, "/api/articles/" + owners.articleB(),
            Map.of("title", scopePrefix + "unauthorized_article_update")
        );

        assertThat(article.getStatusCode().value()).isEqualTo(403);
    }

    @Test
    void inheritorCannotUpdateAnotherOwnersExhibition() {
        Owners owners = seedOwnersAndContent();

        ResponseEntity<Map> exhibition = exchangeAs(
            owners.inheritorAToken(), HttpMethod.PUT, "/api/exhibitions/" + owners.exhibitionB(),
            Map.of("title", scopePrefix + "unauthorized_exhibition_update")
        );

        assertThat(exhibition.getStatusCode().value()).isEqualTo(403);
    }

    private Owners seedOwnersAndContent() {
        long adminId = ensureUser(scopePrefix + "admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long inheritorAId = ensureUser(scopePrefix + "inheritor_a", "INHERITOR", "INHERITOR");
        long inheritorBId = ensureUser(scopePrefix + "inheritor_b", "INHERITOR", "INHERITOR");
        long productA = insertProduct("a", inheritorAId);
        long productB = insertProduct("b", inheritorBId);
        long articleA = insertArticle("a", inheritorAId);
        long articleB = insertArticle("b", inheritorBId);
        long exhibitionA = insertExhibition("a", inheritorAId);
        long exhibitionB = insertExhibition("b", inheritorBId);
        return new Owners(
            loginToken(scopePrefix + "admin"),
            loginToken(scopePrefix + "inheritor_a"),
            productA, productB, articleA, articleB, exhibitionA, exhibitionB
        );
    }

    private long ensureUser(String username, String userType, String roleCode) {
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values (?, '{noop}test', ?, ?)
            on duplicate key update password_hash = values(password_hash), nickname = values(nickname),
              user_type = values(user_type), status = 1, deleted = 0
            """, username, username, userType);
        long userId = jdbcTemplate.queryForObject("select id from sys_users where username = ?", Long.class, username);
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = ?
            on duplicate key update user_id = values(user_id)
            """, userId, roleCode);
        return userId;
    }

    private long insertProduct(String ownerSuffix, long ownerId) {
        jdbcTemplate.update("""
            insert into creative_products (product_code, name, owner_user_id, price, stock, status)
            values (?, ?, ?, ?, 5, 'APPROVED')
            """, scopePrefix + "product_" + ownerSuffix, scopePrefix + "product_" + ownerSuffix, ownerId, BigDecimal.TEN);
        return jdbcTemplate.queryForObject("select id from creative_products where product_code = ?", Long.class, scopePrefix + "product_" + ownerSuffix);
    }

    private long insertArticle(String ownerSuffix, long authorId) {
        String title = scopePrefix + "article_" + ownerSuffix;
        jdbcTemplate.update("""
            insert into news_articles (title, content, author_id, article_type, status)
            values (?, ?, ?, 'NEWS', 'DRAFT')
            """, title, "content", authorId);
        return jdbcTemplate.queryForObject("select id from news_articles where title = ?", Long.class, title);
    }

    private long insertExhibition(String ownerSuffix, long creatorId) {
        String title = scopePrefix + "exhibition_" + ownerSuffix;
        jdbcTemplate.update("insert into exhibitions (title, status, created_by) values (?, 'DRAFT', ?)", title, creatorId);
        return jdbcTemplate.queryForObject("select id from exhibitions where title = ?", Long.class, title);
    }

    private String loginToken(String username) {
        Map<?, ?> captcha = restTemplate.getForObject(url("/api/auth/captcha"), Map.class);
        ResponseEntity<Map> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            Map.of("username", username, "password", "test", "captchaId", captcha.get("captchaId"), "captchaCode", captcha.get("debugCode")),
            Map.class
        );
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        return String.valueOf(login.getBody().get("token"));
    }

    private ResponseEntity<Map> getAs(String token, String path) {
        return exchangeAs(token, HttpMethod.GET, path, null);
    }

    private ResponseEntity<Map> exchangeAs(String token, HttpMethod method, String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(url(path), method, new HttpEntity<>(body, headers), Map.class);
    }

    @SuppressWarnings("unchecked")
    private Set<Long> scopedIds(ResponseEntity<Map> response, long... scopedIds) {
        Set<Long> candidates = java.util.Arrays.stream(scopedIds).boxed().collect(Collectors.toSet());
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
        return items.stream()
            .map(item -> ((Number) item.get("id")).longValue())
            .filter(candidates::contains)
            .collect(Collectors.toSet());
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private record Owners(
        String adminToken,
        String inheritorAToken,
        long productA,
        long productB,
        long articleA,
        long articleB,
        long exhibitionA,
        long exhibitionB
    ) {
    }
}
