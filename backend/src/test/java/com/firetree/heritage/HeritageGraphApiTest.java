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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.Map;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static java.util.Map.entry;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class HeritageGraphApiTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    @AfterEach
    void cleanupTestNodes() {
        jdbcTemplate.update("""
            delete from community_likes
            where (target_type = 'QUESTION' and target_id in (select id from community_questions where title like 'T11%'))
               or (target_type = 'ANSWER' and target_id in (
                   select a.id from community_answers a
                   join community_questions q on q.id = a.question_id
                   where q.title like 'T11%'
               ))
               or user_id in (select id from sys_users where username like 'test_%')
            """);
        jdbcTemplate.update("""
            delete from community_comments
            where (target_type = 'QUESTION' and target_id in (select id from community_questions where title like 'T11%'))
               or (target_type = 'ANSWER' and target_id in (
                   select a.id from community_answers a
                   join community_questions q on q.id = a.question_id
                   where q.title like 'T11%'
               ))
               or author_id in (select id from sys_users where username like 'test_%')
            """);
        jdbcTemplate.update("delete from community_answers where question_id in (select id from community_questions where title like 'T11%' or title like 'T21%')");
        jdbcTemplate.update("delete from community_questions where title like 'T11%' or title like 'T21%'");
        jdbcTemplate.update("delete from content_review_records where raw_content like '%T11%'");
        jdbcTemplate.update("delete from content_review_records where raw_content like '%T14%'");
        jdbcTemplate.update("delete from operation_logs where resource_id in (select id from news_articles where title like 'T16%') or resource_id in (select id from exhibitions where title like 'T17%') or operation like 'T16%' or operation like 'T17%' or operation like 'T18%'");
        jdbcTemplate.update("delete from user_behavior_logs where target_id in (select id from news_articles where title like 'T16%') or target_id in (select id from exhibitions where title like 'T17%') or behavior_type like 'T16%' or behavior_type like 'T17%' or behavior_type like 'T18%'");
        jdbcTemplate.update("delete from search_logs where keyword like 'T18%' or keyword like '%T19%' or keyword like 'test_t8%' or keyword like 'test_t17%'");
        jdbcTemplate.update("""
            delete from graph_edges
            where source_node_id in (
                select gn.id
                from graph_nodes gn
                join exhibitions e on gn.node_code = concat('exhibition_', e.id)
                where e.title like 'T17%'
            )
               or target_node_id in (
                select gn.id
                from graph_nodes gn
                join exhibitions e on gn.node_code = concat('exhibition_', e.id)
                where e.title like 'T17%'
            )
            """);
        jdbcTemplate.update("""
            delete from graph_nodes
            where node_code in (
                select concat('exhibition_', id)
                from exhibitions
                where title like 'T17%'
            )
            """);
        jdbcTemplate.update("delete from article_products where article_id in (select id from news_articles where title like 'T16%') or product_id in (select id from creative_products where product_code like 'test_t16_%')");
        jdbcTemplate.update("delete from exhibition_products where exhibition_id in (select id from exhibitions where title like 'T17%') or product_id in (select id from creative_products where product_code like 'test_t17_%')");
        jdbcTemplate.update("delete from article_nodes where article_id in (select id from news_articles where title like 'T16%')");
        jdbcTemplate.update("delete from exhibition_nodes where exhibition_id in (select id from exhibitions where title like 'T17%')");
        jdbcTemplate.update("delete from news_articles where title like 'T16%'");
        jdbcTemplate.update("delete from exhibitions where title like 'T17%'");
        jdbcTemplate.update("delete from sensitive_words where word like 'test_t11_%'");
        jdbcTemplate.update("delete from sensitive_words where word like 'test_t14_%'");
        jdbcTemplate.update("delete from sensitive_words where word like 'test_t20_%'");
        jdbcTemplate.update("delete from content_review_records where raw_content like '%test_t20_%'");
        jdbcTemplate.update("delete from product_reviews where product_id in (select id from creative_products where product_code like 'test_%' or product_code like 'product_%')");
        jdbcTemplate.update("delete from product_reviews where user_id in (select id from sys_users where username like 'test_%')");
        jdbcTemplate.update("delete from creative_products where product_code like 'test_%' or product_code like 'product_%'");
        jdbcTemplate.update("delete from learning_checkins where user_id in (select id from sys_users where username like 'test_%')");
        jdbcTemplate.update("delete from favorite_nodes where user_id in (select id from sys_users where username like 'test_%') or node_id in (select id from graph_nodes where node_code like 'test_%')");
        jdbcTemplate.update("delete from daily_recommendation_items where node_id in (select id from graph_nodes where node_code like 'test_%' or node_code like 'demo_t13_%')");
        jdbcTemplate.update("delete from daily_recommendations where title like 'T13%' or recommend_date between '2026-06-23' and '2026-06-24'");
        jdbcTemplate.update("""
            delete from review_logs
            where business_type = 'APPLICATION'
              and business_id in (
                select id from heritage_applications where application_no like 'TEST-%'
              )
            """);
        jdbcTemplate.update("delete from application_materials where application_id in (select id from heritage_applications where application_no like 'TEST-%')");
        jdbcTemplate.update("delete from heritage_applications where application_no like 'TEST-%'");
        jdbcTemplate.update("delete from risk_reports where node_id in (select id from graph_nodes where node_code like 'test_%')");
        jdbcTemplate.update("delete from risk_reports where rule_id in (select id from risk_rules where rule_code in ('CONFLICTING_INHERITANCE_EDGE', 'DUPLICATED_INHERITANCE_CHAIN', 'AGING_INHERITOR_NO_SUCCESSOR'))");
        jdbcTemplate.update("delete from graph_node_media where node_id in (select id from graph_nodes where node_code like 'test_%' or node_code like 'demo_t13_%')");
        jdbcTemplate.update("delete from graph_node_media where file_id in (select id from media_files where object_key like 'test/%' or object_key like 'avatars/%' or object_key like 'uploads/%')");
        jdbcTemplate.update("delete from media_files where object_key like 'test/%' or object_key like 'avatars/%' or object_key like 'uploads/%'");
        jdbcTemplate.update("delete from graph_node_tags where node_id in (select id from graph_nodes where node_code like 'test_%' or node_code like 'demo_t13_%')");
        jdbcTemplate.update("delete from graph_edges where source_node_id in (select id from graph_nodes where node_code like 'test_%' or node_code like 'demo_t13_%' or node_code like 'application_TEST_%') or target_node_id in (select id from graph_nodes where node_code like 'test_%' or node_code like 'demo_t13_%' or node_code like 'application_TEST_%')");
        jdbcTemplate.update("delete from graph_nodes where node_code like 'test_%'");
        jdbcTemplate.update("delete from graph_nodes where node_code like 'demo_t13_%'");
        jdbcTemplate.update("delete from graph_nodes where node_code like 'application_TEST_%'");
        jdbcTemplate.update("delete from sys_users where username like 'test_%'");
    }

    @Test
    void healthEndpointReportsDatabaseConnectivity() {
        Map<String, Object> body = get("/api/health");

        assertThat(body).containsEntry("status", "UP");
        assertThat(body).containsEntry("database", "heritage_graph");
    }

    @Test
    void graphOverviewExposesSeededGraphMetadata() {
        Map<String, Object> body = get("/api/graph/overview");

        assertThat(((Number) body.get("nodeTypeCount")).intValue()).isGreaterThanOrEqualTo(7);
        assertThat(((Number) body.get("edgeTypeCount")).intValue()).isGreaterThanOrEqualTo(8);
        assertThat(body.get("nodeTypes").toString()).contains("heritage_project", "inheritor", "region", "unesco_element");
        assertThat(body.get("edgeTypes").toString()).contains("originated_in", "has_inheritor", "listed_by");
        assertThat(((Number) body.get("nodeCount")).intValue()).isGreaterThanOrEqualTo(0);
        assertThat(((Number) body.get("edgeCount")).intValue()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void dashboardSummaryExposesProjectReadinessMetrics() {
        Map<String, Object> body = get("/api/dashboard/summary");

        assertThat(body).containsEntry("roleCount", 3);
        assertThat(body).containsEntry("permissionCount", 13);
        assertThat(body).containsEntry("riskRuleCount", 8);
    }

    @Test
    void authLoginAndCurrentUserExposeRbacMenusReachT3() {
        long userId = insertTestUser("test_auth_admin", "T3 Auth Admin", "SUPER_ADMIN");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'SUPER_ADMIN'
            on duplicate key update user_id = values(user_id)
            """, userId);

        ResponseEntity<Map> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            loginRequest("test_auth_admin", "test"),
            Map.class
        );

        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(login.getBody()).containsKeys("token", "user", "roles", "permissions", "menus");
        assertThat(login.getBody().get("roles").toString()).contains("SUPER_ADMIN");
        assertThat(login.getBody().get("permissions").toString()).contains("graph:node:manage", "system:rbac:manage");
        assertThat(login.getBody().get("menus").toString()).contains("/graph/nodes", "/system/rbac");

        ResponseEntity<Map> missingToken = restTemplate.getForEntity(url("/api/auth/me"), Map.class);
        assertThat(missingToken.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        String token = login.getBody().get("token").toString();
        HttpHeaders invalidHeaders = new HttpHeaders();
        invalidHeaders.setBearerAuth("invalid-token");
        ResponseEntity<Map> invalidToken = restTemplate.exchange(
            url("/api/auth/me"),
            HttpMethod.GET,
            new HttpEntity<>(invalidHeaders),
            Map.class
        );
        assertThat(invalidToken.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> currentUser = restTemplate.exchange(
            url("/api/auth/me"),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        assertThat(currentUser.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Map<?, ?>) currentUser.getBody().get("user")).get("username")).isEqualTo("test_auth_admin");
        assertThat(currentUser.getBody().get("permissions").toString()).contains("dashboard:view", "risk:report:view");

        ResponseEntity<Map> registered = restTemplate.postForEntity(
            url("/api/auth/register"),
            verifiedRegisterRequest("test_auth_new_user", "test", "T3 Registered User", "test_auth_new_user@example.test"),
            Map.class
        );
        assertThat(registered.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Map<?, ?>) registered.getBody().get("user")).get("username")).isEqualTo("test_auth_new_user");
        assertThat(registered.getBody().get("roles").toString()).contains("NORMAL_USER");
    }

    @Test
    void seededRbacMenusMatchBackstageRoleBoundaries() {
        long normalId = insertTestUser("test_rbac_normal", "T RBAC Normal", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, normalId);

        long inheritorId = insertTestUser("test_rbac_inheritor", "T RBAC Inheritor", "INHERITOR");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'INHERITOR'
            on duplicate key update user_id = values(user_id)
            """, inheritorId);

        long adminId = insertTestUser("test_rbac_admin", "T RBAC Admin", "SUPER_ADMIN");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'SUPER_ADMIN'
            on duplicate key update user_id = values(user_id)
            """, adminId);

        Map<?, ?> normal = currentUserPayload(loginToken("test_rbac_normal"));
        assertThat(normal.get("menus").toString()).doesNotContain("/dashboard", "/graph/nodes", "/favorites", "/learning");

        Map<?, ?> inheritor = currentUserPayload(loginToken("test_rbac_inheritor"));
        assertThat(inheritor.get("menus").toString()).contains("/dashboard", "/graph", "/applications", "/community", "/products");
        assertThat(inheritor.get("menus").toString()).doesNotContain(
            "/graph/nodes",
            "/graph/edges",
            "/risk/reports",
            "/favorites",
            "/learning",
            "/system/rbac"
        );

        Map<?, ?> admin = currentUserPayload(loginToken("test_rbac_admin"));
        assertThat(admin.get("menus").toString()).contains("/applications", "/risk/reports", "/favorites", "/learning", "/system/rbac");
    }

    @Test
    void canonicalGraphAndMediaWritesRequireSuperAdmin() {
        long normalId = insertTestUser("test_acl_normal", "T ACL Normal", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, normalId);

        long inheritorId = insertTestUser("test_acl_inheritor", "T ACL Inheritor", "INHERITOR");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'INHERITOR'
            on duplicate key update user_id = values(user_id)
            """, inheritorId);

        long adminId = insertTestUser("test_acl_admin", "T ACL Admin", "SUPER_ADMIN");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'SUPER_ADMIN'
            on duplicate key update user_id = values(user_id)
            """, adminId);

        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        String inheritorToken = loginToken("test_acl_inheritor");
        String adminToken = loginToken("test_acl_admin");

        Map<String, Object> nodeRequest = Map.of(
            "nodeCode", "test_acl_owned_node",
            "nodeTypeId", projectTypeId,
            "name", "T ACL Owned Node",
            "visibility", "PUBLIC",
            "auditStatus", "PENDING"
        );

        ResponseEntity<Map> normalCreate = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            bearerEntity(loginToken("test_acl_normal"), nodeRequest),
            Map.class
        );
        assertThat(normalCreate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> inheritorCreate = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, nodeRequest),
            Map.class
        );
        assertThat(inheritorCreate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> adminCreate = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            bearerEntity(adminToken, nodeRequest),
            Map.class
        );
        assertThat(adminCreate.getStatusCode().is2xxSuccessful()).isTrue();
        Number nodeId = (Number) adminCreate.getBody().get("id");

        long regionTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'region'", Long.class);
        long targetNodeId = insertTestNode("test_acl_target_node", regionTypeId, "T ACL Target Node");
        long edgeTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'originated_in'", Long.class);
        Map<String, Object> edgeRequest = Map.of(
            "sourceNodeId", nodeId.longValue(),
            "targetNodeId", targetNodeId,
            "edgeTypeId", edgeTypeId,
            "directed", true,
            "weight", 1,
            "auditStatus", "APPROVED"
        );

        ResponseEntity<Map> inheritorEdge = restTemplate.exchange(
            url("/api/graph/edges"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, edgeRequest),
            Map.class
        );
        assertThat(inheritorEdge.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> adminEdge = restTemplate.exchange(
            url("/api/graph/edges"),
            HttpMethod.POST,
            bearerEntity(adminToken, edgeRequest),
            Map.class
        );
        assertThat(adminEdge.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> media = restTemplate.exchange(
            url("/api/media/files"),
            HttpMethod.POST,
            bearerEntity(adminToken, Map.of(
                "bucketName", "test",
                "objectKey", "test/acl-media.jpg",
                "originalName", "T ACL Media",
                "fileType", "IMAGE",
                "contentType", "image/jpeg",
                "fileSize", 128,
                "visibility", "PUBLIC",
                "auditStatus", "APPROVED"
            )),
            Map.class
        );
        assertThat(media.getStatusCode().is2xxSuccessful()).isTrue();
        Number fileId = (Number) media.getBody().get("id");

        ResponseEntity<Map> inheritorLink = restTemplate.exchange(
            url("/api/media/files/" + fileId.longValue() + "/links"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of("nodeId", nodeId.longValue(), "caption", "denied")),
            Map.class
        );
        assertThat(inheritorLink.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> inheritorRiskScan = restTemplate.exchange(
            url("/api/risk/scan"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of()),
            Map.class
        );
        assertThat(inheritorRiskScan.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> adminRiskScan = restTemplate.exchange(
            url("/api/risk/scan"),
            HttpMethod.POST,
            bearerEntity(adminToken, Map.of()),
            Map.class
        );
        assertThat(adminRiskScan.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void backstageOnlyEndpointsRejectUnauthorizedRoles() {
        long normalId = insertTestUser("test_acl_normal_2", "T ACL Normal 2", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, normalId);

        long inheritorId = insertTestUser("test_acl_inheritor_2", "T ACL Inheritor 2", "INHERITOR");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'INHERITOR'
            on duplicate key update user_id = values(user_id)
            """, inheritorId);

        String normalToken = loginToken("test_acl_normal_2");
        String inheritorToken = loginToken("test_acl_inheritor_2");

        ResponseEntity<Map> normalGenerate = restTemplate.exchange(
            url("/api/learning/recommendations/generate"),
            HttpMethod.POST,
            bearerEntity(normalToken, Map.of()),
            Map.class
        );
        assertThat(normalGenerate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> inheritorGenerate = restTemplate.exchange(
            url("/api/learning/recommendations/generate"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of()),
            Map.class
        );
        assertThat(inheritorGenerate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> inheritorAnalytics = restTemplate.exchange(
            url("/api/analytics/overview"),
            HttpMethod.GET,
            bearerEntity(inheritorToken, Map.of()),
            Map.class
        );
        assertThat(inheritorAnalytics.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void authCaptchaEmailRegisterAndForgotPasswordFlow() {
        ResponseEntity<Map> captcha = restTemplate.getForEntity(url("/api/auth/captcha"), Map.class);
        assertThat(captcha.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(captcha.getBody()).containsKeys("captchaId", "captchaImage", "debugCode");
        assertThat(captcha.getBody().get("captchaImage").toString()).startsWith("data:image/svg+xml;base64,");

        String email = "test_auth_email_flow@example.test";
        Map<String, Object> registerRequest = verifiedRegisterRequest(
            "test_auth_email_flow",
            "test",
            "T Email Flow",
            email
        );
        ResponseEntity<Map> registered = restTemplate.postForEntity(url("/api/auth/register"), registerRequest, Map.class);
        assertThat(registered.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Map<?, ?>) registered.getBody().get("user")).get("email")).isEqualTo(email);

        Map<String, Object> resetEmailCode = emailCodeRequest(email, "RESET_PASSWORD");
        ResponseEntity<Map> reset = restTemplate.postForEntity(
            url("/api/auth/password/reset"),
            Map.of(
                "email", email,
                "emailCode", resetEmailCode.get("emailCode"),
                "newPassword", "reset-password"
            ),
            Map.class
        );
        assertThat(reset.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> newLogin = restTemplate.postForEntity(
            url("/api/auth/login"),
            loginRequest("test_auth_email_flow", "reset-password"),
            Map.class
        );
        assertThat(newLogin.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void authProfileUpdateAndPasswordChangeUseBearerUser() {
        insertTestUser("test_profile_user", "Old Nickname", "NORMAL");
        String token = loginToken("test_profile_user");

        ResponseEntity<Map> updatedProfile = restTemplate.exchange(
            url("/api/auth/me/profile"),
            HttpMethod.PUT,
            bearerEntity(token, Map.of(
                "nickname", "New Nickname",
                "realName", "Profile Real Name",
                "phone", "18800001111",
                "email", "profile-user@example.test",
                "avatarUrl", "https://example.test/avatar/profile-user.png"
            )),
            Map.class
        );

        assertThat(updatedProfile.getStatusCode().is2xxSuccessful()).isTrue();
        Map<?, ?> updatedUser = (Map<?, ?>) updatedProfile.getBody().get("user");
        assertThat(updatedUser.get("username")).isEqualTo("test_profile_user");
        assertThat(updatedUser.get("nickname")).isEqualTo("New Nickname");
        assertThat(updatedUser.get("realName")).isEqualTo("Profile Real Name");
        assertThat(updatedUser.get("phone")).isEqualTo("18800001111");
        assertThat(updatedUser.get("email")).isEqualTo("profile-user@example.test");
        assertThat(updatedUser.get("avatarUrl")).isEqualTo("https://example.test/avatar/profile-user.png");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> currentUser = restTemplate.exchange(
            url("/api/auth/me"),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
        assertThat(((Map<?, ?>) currentUser.getBody().get("user")).get("nickname")).isEqualTo("New Nickname");

        ResponseEntity<Map> changedPassword = restTemplate.exchange(
            url("/api/auth/me/password"),
            HttpMethod.PUT,
            bearerEntity(token, Map.of("oldPassword", "test", "newPassword", "changed-test-password")),
            Map.class
        );
        assertThat(changedPassword.getStatusCode().is2xxSuccessful()).isTrue();

        String storedPassword = jdbcTemplate.queryForObject(
            "select password_hash from sys_users where username = 'test_profile_user'",
            String.class
        );
        assertThat(storedPassword).isEqualTo("{noop}changed-test-password");

        ResponseEntity<Map> newLogin = restTemplate.postForEntity(
            url("/api/auth/login"),
            loginRequest("test_profile_user", "changed-test-password"),
            Map.class
        );
        assertThat(newLogin.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void currentUserAvatarUploadStoresImageAndUpdatesProfile() {
        insertTestUser("test_avatar_user", "Avatar User", "NORMAL");
        String token = loginToken("test_avatar_user");

        MockMultipartFile avatar = new MockMultipartFile(
            "file",
            "avatar.png",
            "image/png",
            new byte[] {1, 2, 3, 4}
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", avatar.getResource());

        ResponseEntity<Map> uploaded = restTemplate.exchange(
            url("/api/auth/me/avatar"),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        assertThat(uploaded.getStatusCode().is2xxSuccessful()).isTrue();
        Map<?, ?> user = (Map<?, ?>) uploaded.getBody().get("user");
        assertThat(user.get("avatarUrl").toString()).startsWith("/uploads/media/avatars/");
        assertThat(uploaded.getBody().get("avatarUrl")).isEqualTo(user.get("avatarUrl"));

        String storedAvatarUrl = jdbcTemplate.queryForObject(
            "select avatar_url from sys_users where username = 'test_avatar_user'",
            String.class
        );
        assertThat(storedAvatarUrl).isEqualTo(user.get("avatarUrl"));
    }

    @Test
    void graphNodeManagementSupportsCreateSearchUpdateAndLogicalDelete() {
        Map<String, Object> nodeTypes = get("/api/graph/node-types");
        assertThat(((Number) nodeTypes.get("total")).intValue()).isGreaterThanOrEqualTo(7);
        assertThat(nodeTypes.get("items").toString()).contains("heritage_project", "region", "unesco_element");

        Long heritageProjectTypeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );

        Map<String, Object> createRequest = Map.ofEntries(
            entry("nodeCode", "test_suxiu_node"),
            entry("nodeTypeId", heritageProjectTypeId),
            entry("name", "测试苏绣"),
            entry("category", "传统技艺"),
            entry("summary", "用于接口集成测试的非遗项目节点"),
            entry("content", "后台维护的详情正文"),
            entry("province", "江苏省"),
            entry("city", "苏州市"),
            entry("sourceName", "后台录入来源"),
            entry("sourceUrl", "https://example.test/source/suxiu"),
            entry("coverImageUrl", "https://example.test/suxiu-admin-cover.jpg"),
            entry("coverImageCaption", "后台维护封面"),
            entry("visibility", "PUBLIC"),
            entry("auditStatus", "PENDING")
        );

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("nodeCode", "test_suxiu_node");
        assertThat(created.getBody()).containsEntry("name", "测试苏绣");
        assertThat(created.getBody()).containsEntry("category", "传统技艺");
        assertThat(created.getBody()).containsEntry("sourceName", "后台录入来源");
        assertThat(created.getBody()).containsEntry("sourceUrl", "https://example.test/source/suxiu");
        assertThat(created.getBody()).containsEntry("coverImageUrl", "https://example.test/suxiu-admin-cover.jpg");
        assertThat(created.getBody()).containsEntry("coverImageCaption", "后台维护封面");
        Number createdId = (Number) created.getBody().get("id");

        Map<String, Object> list = get("/api/graph/nodes?keyword=test_suxiu_node&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("测试苏绣");

        Map<String, Object> updateRequest = Map.of(
            "name", "测试苏绣项目",
            "category", "民俗",
            "summary", "更新后的节点简介",
            "content", "更新后的后台详情正文",
            "province", "江苏省",
            "city", "苏州市",
            "sourceName", "更新后的来源",
            "sourceUrl", "https://example.test/source/suxiu-updated",
            "visibility", "PUBLIC",
            "auditStatus", "APPROVED"
        );

        restTemplate.exchange(
            url("/api/graph/nodes/" + createdId.longValue()),
            HttpMethod.PUT,
            adminEntity(updateRequest),
            Map.class
        );
        Map<String, Object> detail = get("/api/graph/nodes/" + createdId.longValue());
        assertThat(detail).containsEntry("name", "测试苏绣项目");
        assertThat(detail).containsEntry("auditStatus", "APPROVED");
        assertThat(detail).containsEntry("category", "民俗");
        assertThat(detail).containsEntry("content", "更新后的后台详情正文");
        assertThat(detail).containsEntry("sourceName", "更新后的来源");
        assertThat(detail).containsEntry("sourceUrl", "https://example.test/source/suxiu-updated");

        Map<String, Object> clearCoverRequest = Map.of(
            "name", "测试苏绣项目",
            "summary", "更新后的节点简介",
            "province", "江苏省",
            "city", "苏州市",
            "coverImageUrl", "",
            "coverImageCaption", "",
            "visibility", "PUBLIC",
            "auditStatus", "APPROVED"
        );
        restTemplate.exchange(
            url("/api/graph/nodes/" + createdId.longValue()),
            HttpMethod.PUT,
            adminEntity(clearCoverRequest),
            Map.class
        );
        Map<String, Object> clearedCoverDetail = get("/api/graph/nodes/" + createdId.longValue());
        assertThat(clearedCoverDetail.get("coverImageUrl")).isNull();
        assertThat(clearedCoverDetail.get("coverImageCaption")).isNull();

        restTemplate.exchange(url("/api/graph/nodes/" + createdId.longValue()), HttpMethod.DELETE, adminEmptyEntity(), Void.class);
        Map<String, Object> afterDelete = get("/api/graph/nodes?keyword=test_suxiu_node&page=1&size=10");
        assertThat(afterDelete).containsEntry("total", 0);
    }

    @Test
    void graphNodeCreateRecyclesSoftDeletedNodeCode() {
        Long heritageProjectTypeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );

        Map<String, Object> createRequest = Map.of(
            "nodeCode", "test_recycled_code",
            "nodeTypeId", heritageProjectTypeId,
            "name", "回收编码节点"
        );
        ResponseEntity<Map> first = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );
        assertThat(first.getStatusCode().is2xxSuccessful()).isTrue();
        Number firstId = (Number) first.getBody().get("id");

        restTemplate.exchange(
            url("/api/graph/nodes/" + firstId.longValue()),
            HttpMethod.DELETE,
            adminEmptyEntity(),
            Void.class
        );

        Map<String, Object> recreateRequest = Map.of(
            "nodeCode", "test_recycled_code",
            "nodeTypeId", heritageProjectTypeId,
            "name", "回收编码节点-重建",
            "summary", "删除后使用相同业务编码重新创建"
        );
        ResponseEntity<Map> recreated = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(recreateRequest),
            Map.class
        );

        assertThat(recreated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(recreated.getBody()).containsEntry("nodeCode", "test_recycled_code");
        assertThat(recreated.getBody()).containsEntry("name", "回收编码节点-重建");
        assertThat(recreated.getBody()).containsEntry("summary", "删除后使用相同业务编码重新创建");
        assertThat(((Number) recreated.getBody().get("id")).longValue()).isEqualTo(firstId.longValue());

        Map<String, Object> list = get("/api/graph/nodes?keyword=test_recycled_code&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("回收编码节点-重建");
    }

    @Test
    void graphNodeCreateRejectsDuplicateCodeWhileNodeIsAlive() {
        Long heritageProjectTypeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );

        Map<String, Object> createRequest = Map.of(
            "nodeCode", "test_live_conflict_code",
            "nodeTypeId", heritageProjectTypeId,
            "name", "存活编码节点"
        );
        ResponseEntity<Map> first = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );
        assertThat(first.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> duplicate = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "nodeCode", "test_live_conflict_code",
                "nodeTypeId", heritageProjectTypeId,
                "name", "存活编码节点-重复"
            )),
            Map.class
        );

        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        Map<String, Object> list = get("/api/graph/nodes?keyword=test_live_conflict_code&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("存活编码节点");
        assertThat(list.get("items").toString()).doesNotContain("存活编码节点-重复");
    }

    @Test
    void graphNodesExposeCoverImageAndDetailFieldsFromDatabase() {
        long projectTypeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );
        long nodeId = insertTestNode("test_media_detail_project", projectTypeId, "T16 Media Detail Project");
        jdbcTemplate.update("""
            update graph_nodes
            set
              alias = 'T16 Alias',
              summary = 'T16 summary for explore card',
              content = 'T16 long database content for detail page',
              province = 'T16 Province',
              city = 'T16 City',
              historical_period = 'T16 Period',
              project_level = 'T16 Level',
              visibility = 'PUBLIC',
              audit_status = 'APPROVED'
            where id = ?
            """, nodeId);
        jdbcTemplate.update("""
            insert into media_files (
              bucket_name, object_key, original_name, file_type, content_type,
              file_size, checksum, preview_url, visibility, audit_status, deleted
            ) values (
              'heritage-test', 'test/t16-cover.jpg', 't16-cover.jpg', 'IMAGE', 'image/jpeg',
              4096, 'sha256-test-t16-cover', 'https://example.test/t16-cover.jpg', 'PUBLIC', 'APPROVED', 0
            )
            """);
        jdbcTemplate.update("""
            insert into media_files (
              bucket_name, object_key, original_name, file_type, content_type,
              file_size, checksum, preview_url, visibility, audit_status, deleted
            ) values (
              'heritage-test', 'test/t16-audio.mp3', 't16-audio.mp3', 'AUDIO', 'audio/mpeg',
              2048, 'sha256-test-t16-audio', '/uploads/media/test/t16-audio.mp3', 'PUBLIC', 'APPROVED', 0
            )
            """);
        jdbcTemplate.update("""
            insert into media_files (
              bucket_name, object_key, original_name, file_type, content_type,
              file_size, checksum, preview_url, visibility, audit_status, deleted
            ) values (
              'heritage-test', 'test/t16-private.jpg', 't16-private.jpg', 'IMAGE', 'image/jpeg',
              1024, 'sha256-test-t16-private', 'https://example.test/t16-private.jpg', 'PRIVATE', 'APPROVED', 0
            )
            """);
        long fileId = jdbcTemplate.queryForObject(
            "select id from media_files where object_key = 'test/t16-cover.jpg'",
            Long.class
        );
        long audioFileId = jdbcTemplate.queryForObject(
            "select id from media_files where object_key = 'test/t16-audio.mp3'",
            Long.class
        );
        long privateFileId = jdbcTemplate.queryForObject(
            "select id from media_files where object_key = 'test/t16-private.jpg'",
            Long.class
        );
        jdbcTemplate.update("""
            insert into graph_node_media (node_id, file_id, caption, sort_order)
            values (?, ?, 'T16 cover caption', 1)
            """, nodeId, fileId);
        jdbcTemplate.update("""
            insert into graph_node_media (node_id, file_id, caption, sort_order)
            values (?, ?, 'T16 oral audio', 2)
            """, nodeId, audioFileId);
        jdbcTemplate.update("""
            insert into graph_node_media (node_id, file_id, caption, sort_order)
            values (?, ?, 'T16 private should stay hidden', 3)
            """, nodeId, privateFileId);

        Map<String, Object> list = get("/api/graph/nodes?keyword=test_media_detail_project&page=1&size=10");

        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains(
            "test_media_detail_project",
            "https://example.test/t16-cover.jpg",
            "T16 cover caption",
            "T16 Level"
        );

        Map<String, Object> detail = get("/api/graph/nodes/" + nodeId);
        assertThat(detail).containsEntry("nodeCode", "test_media_detail_project");
        assertThat(detail).containsEntry("alias", "T16 Alias");
        assertThat(detail).containsEntry("content", "T16 long database content for detail page");
        assertThat(detail).containsEntry("historicalPeriod", "T16 Period");
        assertThat(detail).containsEntry("projectLevel", "T16 Level");
        assertThat(detail).containsEntry("coverImageUrl", "https://example.test/t16-cover.jpg");
        assertThat(detail).containsEntry("coverImageCaption", "T16 cover caption");
        assertThat(detail.get("mediaFiles")).asList().hasSize(2);
        assertThat(detail.get("mediaFiles").toString()).contains(
            "t16-cover.jpg",
            "T16 cover caption",
            "t16-audio.mp3",
            "T16 oral audio",
            "/uploads/media/test/t16-audio.mp3"
        );
        assertThat(detail.get("mediaFiles").toString()).doesNotContain("t16-private.jpg", "T16 private should stay hidden");

        Map<String, Object> adminDetail = getAsAdmin("/api/graph/nodes/" + nodeId + "?includeAllMedia=true");
        assertThat(adminDetail.get("mediaFiles")).asList().hasSize(3);
        assertThat(adminDetail.get("mediaFiles").toString()).contains(
            "t16-cover.jpg",
            "T16 cover caption",
            "t16-audio.mp3",
            "T16 oral audio",
            "t16-private.jpg",
            "T16 private should stay hidden"
        );
    }

    @Test
    void graphEdgeManagementSupportsCrudAndValidationRules() {
        Map<String, Object> edgeTypes = get("/api/graph/edge-types");
        assertThat(((Number) edgeTypes.get("total")).intValue()).isGreaterThanOrEqualTo(8);
        assertThat(edgeTypes.get("items").toString()).contains("originated_in", "has_inheritor", "listed_by");

        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long regionTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'region'", Long.class);
        long edgeTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'originated_in'", Long.class);
        long sourceId = insertTestNode("test_edge_suxiu", projectTypeId, "测试苏绣");
        long targetId = insertTestNode("test_edge_suzhou", regionTypeId, "测试苏州");

        Map<String, Object> createRequest = Map.of(
            "sourceNodeId", sourceId,
            "targetNodeId", targetId,
            "edgeTypeId", edgeTypeId,
            "directed", true,
            "weight", 0.88,
            "relationLabel", "发源地",
            "auditStatus", "PENDING"
        );

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/graph/edges"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("sourceNodeId", (int) sourceId);
        assertThat(created.getBody()).containsEntry("targetNodeId", (int) targetId);
        assertThat(created.getBody()).containsEntry("relationLabel", "发源地");
        Number createdId = (Number) created.getBody().get("id");

        ResponseEntity<Map> duplicate = restTemplate.exchange(
            url("/api/graph/edges"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        Map<String, Object> selfLoopRequest = Map.of(
            "sourceNodeId", sourceId,
            "targetNodeId", sourceId,
            "edgeTypeId", edgeTypeId
        );
        ResponseEntity<Map> selfLoop = restTemplate.exchange(
            url("/api/graph/edges"),
            HttpMethod.POST,
            adminEntity(selfLoopRequest),
            Map.class
        );
        assertThat(selfLoop.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        Map<String, Object> list = get("/api/graph/edges?keyword=test_edge_suxiu&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("测试苏绣", "测试苏州", "发源于");

        Map<String, Object> updateRequest = Map.of(
            "weight", 0.66,
            "relationLabel", "历史发源地",
            "auditStatus", "APPROVED"
        );
        restTemplate.exchange(
            url("/api/graph/edges/" + createdId.longValue()),
            HttpMethod.PUT,
            adminEntity(updateRequest),
            Map.class
        );
        Map<String, Object> detail = get("/api/graph/edges/" + createdId.longValue());
        assertThat(detail).containsEntry("relationLabel", "历史发源地");
        assertThat(detail).containsEntry("auditStatus", "APPROVED");

        restTemplate.exchange(url("/api/graph/edges/" + createdId.longValue()), HttpMethod.DELETE, adminEmptyEntity(), Void.class);
        Map<String, Object> afterDelete = get("/api/graph/edges?keyword=test_edge_suxiu&page=1&size=10");
        assertThat(afterDelete).containsEntry("total", 0);
    }

    @Test
    void graphVisualizationSemanticSearchAndRiskScanReachT8() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);
        long inheritedFromTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'inherited_from'", Long.class);

        long projectId = insertTestNode("test_t8_suxiu", projectTypeId, "T8 Suzhou Embroidery");
        long inheritorId = insertTestNode("test_t8_student", inheritorTypeId, "T8 Student");
        long masterId = insertTestNode("test_t8_master", inheritorTypeId, "T8 Master");
        insertTestNode("test_t8_lonely", projectTypeId, "T8 Lonely Project");
        insertTestEdge(projectId, inheritorId, hasInheritorTypeId, "has inheritor");
        insertTestEdge(inheritorId, masterId, inheritedFromTypeId, "inherited from");

        Map<String, Object> visualization = get("/api/graph/visualization?keyword=test_t8&page=1&size=20");
        assertThat(visualization).containsEntry("nodeCount", 4);
        assertThat(visualization).containsEntry("edgeCount", 2);
        assertThat(visualization.get("nodes").toString()).contains("test_t8_suxiu", "test_t8_student", "test_t8_master");
        assertThat(visualization.get("edges").toString()).contains("has inheritor", "inherited from");

        Map<String, Object> semantic = get("/api/graph/search/semantic?question=test_t8_suxiu%20inheritor%20master");
        assertThat(semantic).containsEntry("total", 1);
        assertThat(semantic.get("chains").toString()).contains("test_t8_suxiu", "test_t8_student", "test_t8_master");

        ResponseEntity<Map> scan = restTemplate.exchange(url("/api/risk/scan"), HttpMethod.POST, adminEntity(Map.of()), Map.class);
        assertThat(scan.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Number) scan.getBody().get("generatedCount")).intValue()).isGreaterThanOrEqualTo(1);

        Map<String, Object> reports = getAsAdmin("/api/risk/reports?keyword=test_t8_lonely&page=1&size=10");
        assertThat(reports).containsEntry("total", 1);
        assertThat(reports.get("items").toString()).contains("NO_INHERITOR_FOR_PROJECT", "test_t8_lonely", "HIGH", "OPEN");
    }

    @Test
    void unifiedGraphSearchRelationsPathAndAiSearchSupportTypedHeritageDiscovery() {
        ensureTestNodeType("craft_technique", "Craft Technique");
        ensureTestNodeType("craft_tool", "Craft Tool");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long techniqueTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'craft_technique'", Long.class);
        long toolTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'craft_tool'", Long.class);
        ensureTestEdgeType("uses_technique", "uses technique", "used by");
        ensureTestEdgeType("masters_technique", "masters technique", "mastered by");
        ensureTestEdgeType("uses_tool", "uses tool", "used by");
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);
        long usesTechniqueTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'uses_technique'", Long.class);
        long mastersTechniqueTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'masters_technique'", Long.class);
        long usesToolTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'uses_tool'", Long.class);

        long projectId = insertTestNode("test_t17_project", projectTypeId, "T17 Heritage Project");
        long inheritorId = insertTestNode("test_t17_inheritor", inheritorTypeId, "T17 Inheritor");
        long techniqueId = insertTestNode("test_t17_technique", techniqueTypeId, "T17 Needle Technique");
        long toolId = insertTestNode("test_t17_tool", toolTypeId, "T17 Embroidery Frame");
        insertTestEdge(projectId, inheritorId, hasInheritorTypeId, "has inheritor");
        insertTestEdge(projectId, techniqueId, usesTechniqueTypeId, "uses technique");
        insertTestEdge(inheritorId, techniqueId, mastersTechniqueTypeId, "masters technique");
        insertTestEdge(projectId, toolId, usesToolTypeId, "uses tool");

        Map<String, Object> unified = get("/api/graph/search?keyword=test_t17&typeCodes=heritage_project&typeCodes=craft_technique&includeRelations=true&page=1&size=10");
        assertThat(unified).containsEntry("total", 2);
        assertThat(unified.get("groups").toString()).contains("heritage_project", "craft_technique", "T17 Heritage Project", "T17 Needle Technique");
        assertThat(unified.get("relationHints").toString()).contains("uses technique");

        Map<String, Object> relations = get("/api/graph/nodes/" + projectId + "/relations?depth=1&direction=out&relationTypes=uses_technique&relationTypes=uses_tool&limit=20");
        assertThat(relations).containsEntry("nodeCount", 3);
        assertThat(relations).containsEntry("edgeCount", 2);
        assertThat(relations.get("nodes").toString()).contains("T17 Heritage Project", "T17 Needle Technique", "T17 Embroidery Frame");

        ResponseEntity<Map> path = restTemplate.postForEntity(
            url("/api/graph/search/path"),
            Map.of("startNodeId", projectId, "paths", List.of(List.of("has_inheritor", "masters_technique")), "limit", 10),
            Map.class
        );
        assertThat(path.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(path.getBody()).containsEntry("total", 1);
        assertThat(path.getBody().get("chains").toString()).contains("T17 Inheritor", "T17 Needle Technique", "masters technique");

        ResponseEntity<Map> ai = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "test_t17_project inheritor technique tool", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );
        assertThat(ai.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ai.getBody().get("plan").toString()).contains("RELATION_EXPLORATION", "inheritor", "craft_technique");
        assertThat(ai.getBody().get("execution").toString()).contains("T17 Inheritor");
    }

    @Test
    void aiGraphSearchResolvesMentionedHeritageEntityBeforeExecutingRelationPath() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);

        long projectId = insertTestNode("test_t18_suxiu", projectTypeId, "苏绣");
        long inheritorId = insertTestNode("test_t18_inheritor", inheritorTypeId, "T18 苏绣传承人");
        insertTestEdge(projectId, inheritorId, hasInheritorTypeId, "T18 has inheritor");

        ResponseEntity<Map> ai = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "苏绣有没有传人", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );

        assertThat(ai.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ai.getBody().get("plan").toString()).contains("苏绣", "has_inheritor", "inheritor");
        assertThat(ai.getBody().get("answer").toString()).contains("传承人", "T18 苏绣传承人");
        assertThat(ai.getBody().get("results").toString()).contains("T18 苏绣传承人", "inheritor");
        assertThat(ai.getBody().get("execution").toString()).contains("T18 苏绣传承人", "T18 has inheritor");
    }

    /**
     * Regression for the 「苗族赶秋有没有传承人」 report: the whole question matched no node, the token
     * fallback ended up searching with an empty keyword (= the whole table by popularity), and every
     * one of those candidates was then used as a start node — so 20 inheritors of *other* projects
     * were listed under the single name the question mentioned.
     *
     * What this pins down: the answer stays scoped to the mentioned project, and other projects'
     * inheritors cannot leak in. What it cannot prove: that a real model-driven plan behaves the
     * same way — the planner is disabled under `application-test.yml`.
     */
    @Test
    void aiGraphSearchKeepsTheAnswerScopedToTheProjectTheQuestionMentions() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);

        long projectId = insertTestNode("test_t21_project", projectTypeId, "T21 赶秋节");
        long inheritorId = insertTestNode("test_t21_inheritor", inheritorTypeId, "T21 本项传承人");
        long otherProjectId = insertTestNode("test_t21_other_project", projectTypeId, "T21 别处项目");
        long otherInheritorId = insertTestNode("test_t21_other_inheritor", inheritorTypeId, "T21 别处传承人");
        insertTestEdge(projectId, inheritorId, hasInheritorTypeId, "T21 has inheritor");
        insertTestEdge(otherProjectId, otherInheritorId, hasInheritorTypeId, "T21 other inheritor");

        ResponseEntity<Map> ai = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "赶秋节有没有传承人", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );

        assertThat(ai.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> body = ai.getBody();
        Map<?, ?> plan = (Map<?, ?>) body.get("plan");
        // One mentioned entity means exactly one start node — search candidates must never be merged.
        assertThat((List<?>) plan.get("startNodes")).hasSize(1);
        assertThat(body.get("results").toString()).contains("T21 本项传承人");
        assertThat(body.get("results").toString()).doesNotContain("T21 别处传承人");
        assertThat(body.get("answer").toString()).contains("赶秋节", "T21 本项传承人");
        assertThat(body.get("answer").toString()).doesNotContain("T21 别处传承人");
        // The card describes the relation from the person's side instead of repeating the edge label
        // 「拥有传承人」, which read as if the person owned an inheritor.
        assertThat(body.get("results").toString()).contains("的传承人");
    }

    @Test
    void aiGraphSearchReportsNothingInsteadOfListingUnrelatedNodes() {
        ResponseEntity<Map> ai = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "完全不存在的节点词组有没有传承人", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );

        assertThat(ai.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> body = ai.getBody();
        assertThat((List<?>) body.get("results")).isEmpty();
        assertThat((List<?>) ((Map<?, ?>) body.get("plan")).get("startNodes")).isEmpty();
        assertThat(body.get("answer").toString()).contains("暂未在图谱中找到");
    }

    @Test
    void aiGraphSearchCoversMultiHopReverseTechniqueRegionAndCurrentNodeIntent() {
        ensureTestNodeType("craft_technique", "Craft Technique");
        ensureTestNodeType("region", "Region");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long techniqueTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'craft_technique'", Long.class);
        long regionTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'region'", Long.class);
        ensureTestEdgeType("masters_technique", "masters technique", "mastered by");
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);
        long inheritedFromTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'inherited_from'", Long.class);
        long mastersTechniqueTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'masters_technique'", Long.class);
        long originatedInTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'originated_in'", Long.class);

        long projectId = insertTestNode("test_t19_project", projectTypeId, "T19 Suzhou Embroidery");
        long studentId = insertTestNode("test_t19_student", inheritorTypeId, "T19 Student Inheritor");
        long masterId = insertTestNode("test_t19_master", inheritorTypeId, "T19 Master Inheritor");
        long techniqueId = insertTestNode("test_t19_split_stitch", techniqueTypeId, "T19 Split Stitch");
        long regionId = insertTestNode("test_t19_region", regionTypeId, "T19 Jiangsu Region");
        insertTestEdge(projectId, studentId, hasInheritorTypeId, "T19 has inheritor");
        insertTestEdge(studentId, masterId, inheritedFromTypeId, "T19 inherited from");
        insertTestEdge(studentId, techniqueId, mastersTechniqueTypeId, "T19 masters technique");
        insertTestEdge(projectId, regionId, originatedInTypeId, "T19 originated in");

        ResponseEntity<Map> masterQuery = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "T19 Suzhou Embroidery inheritor master", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );
        assertThat(masterQuery.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(masterQuery.getBody().get("results").toString()).contains("T19 Master Inheritor");

        ResponseEntity<Map> studentQuery = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "who are T19 Master Inheritor students", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );
        assertThat(studentQuery.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(studentQuery.getBody().get("results").toString()).contains("T19 Student Inheritor");

        ResponseEntity<Map> techniqueQuery = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "who masters T19 Split Stitch", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );
        assertThat(techniqueQuery.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(techniqueQuery.getBody().get("results").toString()).contains("T19 Student Inheritor");

        ResponseEntity<Map> regionQuery = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "which projects are in T19 Jiangsu Region", "mode", "RELATION_EXPLORATION", "topK", 10),
            Map.class
        );
        assertThat(regionQuery.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(regionQuery.getBody().get("results").toString()).contains("T19 Suzhou Embroidery");

        ResponseEntity<Map> contextQuery = restTemplate.postForEntity(
            url("/api/graph/search/ai"),
            Map.of("question", "who are his students", "mode", "RELATION_EXPLORATION", "topK", 10, "currentNodeId", masterId),
            Map.class
        );
        assertThat(contextQuery.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(contextQuery.getBody().get("results").toString()).contains("T19 Student Inheritor");
    }

    @Test
    void aiChatFallsBackToNavigationSuggestionsWhenModelIsUnavailable() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
            url("/api/ai/chat"),
            Map.of("message", "我要提交资料在哪里", "audience", "portal", "currentRoute", "/"),
            Map.class
        );

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).containsEntry("source", "AI_UNAVAILABLE_FALLBACK");
        assertThat(response.getBody().get("suggestions").toString()).contains("/material-submit");
    }

    @Test
    void mediaArchiveSupportsMetadataRegistrationNodeLinkingAndPreview() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t9_media_node", projectTypeId, "T9 Media Project");

        Map<String, Object> createRequest = Map.of(
            "bucketName", "heritage-demo",
            "objectKey", "test/suxiu-stitch.jpg",
            "originalName", "suxiu-stitch.jpg",
            "fileType", "IMAGE",
            "contentType", "image/jpeg",
            "fileSize", 2048,
            "checksum", "sha256-test-media",
            "previewUrl", "https://example.test/suxiu-stitch.jpg",
            "visibility", "PUBLIC",
            "auditStatus", "APPROVED"
        );

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/media/files"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("objectKey", "test/suxiu-stitch.jpg");
        assertThat(created.getBody()).containsEntry("fileType", "IMAGE");
        Number fileId = (Number) created.getBody().get("id");
        Integer persistedMediaRows = jdbcTemplate.queryForObject(
            "select count(*) from media_files where id = ? and object_key = 'test/suxiu-stitch.jpg' and deleted = 0",
            Integer.class,
            fileId.longValue()
        );
        assertThat(persistedMediaRows)
            .as("new media archive records must be persisted in media_files")
            .isEqualTo(1);

        Map<String, Object> linkRequest = Map.of(
            "nodeId", nodeId,
            "caption", "stitch detail photo",
            "sortOrder", 5
        );
        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/media/files/" + fileId.longValue() + "/links"),
            HttpMethod.POST,
            adminEntity(linkRequest),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(linked.getBody()).containsEntry("nodeId", (int) nodeId);
        assertThat(linked.getBody()).containsEntry("caption", "stitch detail photo");

        ResponseEntity<Map> duplicateLink = restTemplate.exchange(
            url("/api/media/files/" + fileId.longValue() + "/links"),
            HttpMethod.POST,
            adminEntity(linkRequest),
            Map.class
        );
        assertThat(duplicateLink.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        Map<String, Object> list = get("/api/media/files?keyword=suxiu&nodeId=" + nodeId + "&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("suxiu-stitch.jpg", "T9 Media Project", "stitch detail photo");

        Map<String, Object> detail = get("/api/media/files/" + fileId.longValue());
        assertThat(detail).containsEntry("previewUrl", "https://example.test/suxiu-stitch.jpg");
        assertThat(detail.get("linkedNodes").toString()).contains("test_t9_media_node", "T9 Media Project");

        Map<String, Object> nodeDetail = get("/api/graph/nodes/" + nodeId);
        assertThat(nodeDetail.get("mediaFiles"))
            .as("node detail should expose media linked through the media archive")
            .asList()
            .hasSize(1);
        assertThat(nodeDetail.get("mediaFiles").toString()).contains(
            "suxiu-stitch.jpg",
            "stitch detail photo",
            "https://example.test/suxiu-stitch.jpg"
        );

        Map<String, Object> adminNodeDetail = getAsAdmin("/api/graph/nodes/" + nodeId + "?includeAllMedia=true");
        assertThat(adminNodeDetail.get("mediaFiles").toString()).contains("suxiu-stitch.jpg", "stitch detail photo");

        Map<String, Object> nodeMedia = get("/api/graph/nodes/" + nodeId + "/media");
        assertThat(nodeMedia).containsEntry("total", 1);
        assertThat(nodeMedia.get("items").toString()).contains("suxiu-stitch.jpg", "stitch detail photo");

        restTemplate.exchange(url("/api/media/files/" + fileId.longValue() + "/links/" + nodeId), HttpMethod.DELETE, adminEmptyEntity(), Void.class);
        Map<String, Object> afterUnlink = get("/api/media/files?nodeId=" + nodeId + "&page=1&size=10");
        assertThat(afterUnlink).containsEntry("total", 0);

        restTemplate.exchange(url("/api/media/files/" + fileId.longValue()), HttpMethod.DELETE, adminEmptyEntity(), Void.class);
        Map<String, Object> afterDelete = get("/api/media/files?keyword=suxiu-stitch&page=1&size=10");
        assertThat(afterDelete).containsEntry("total", 0);
    }

    @Test
    void mediaArchiveUploadCreatesMetadataWithoutManualUrlEntry() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-t9-upload.jpg",
            "image/jpeg",
            "fake-image-content".getBytes()
        );
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken());
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        ResponseEntity<Map> uploaded = restTemplate.exchange(
            url("/api/media/uploads/images"),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        assertThat(uploaded.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(uploaded.getBody()).containsEntry("originalName", "test-t9-upload.jpg");
        assertThat(uploaded.getBody()).containsEntry("fileType", "IMAGE");
        assertThat(uploaded.getBody().get("objectKey").toString()).startsWith("uploads/");
        assertThat(uploaded.getBody().get("previewUrl").toString()).startsWith("/uploads/media/uploads/");
    }

    @Test
    void mediaArchiveCreateGeneratesObjectKeyWhenFormOnlyProvidesFileName() {
        Map<String, Object> createRequest = Map.of(
            "originalName", "t9-auto-key.jpg",
            "fileType", "IMAGE",
            "contentType", "image/jpeg",
            "fileSize", 1024,
            "visibility", "PUBLIC",
            "auditStatus", "APPROVED"
        );

        ResponseEntity<Map> first = restTemplate.exchange(
            url("/api/media/files"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );
        ResponseEntity<Map> second = restTemplate.exchange(
            url("/api/media/files"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(first.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(second.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(first.getBody().get("objectKey").toString()).startsWith("archive/");
        assertThat(second.getBody().get("objectKey").toString()).startsWith("archive/");
        assertThat(first.getBody().get("objectKey")).isNotEqualTo(second.getBody().get("objectKey"));
    }

    @Test
    void applicationReviewSupportsDraftSubmitApproveRejectAndLogs() {
        long applicantId = insertTestUser("test_applicant_t10", "测试申报人", "INHERITOR");
        long reviewerId = insertTestUser("test_reviewer_t10", "测试审核员", "SUPER_ADMIN");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t10_application_node", projectTypeId, "T10 申报节点");

        Map<String, Object> createRequest = Map.of(
            "applicationNo", "TEST-T10-APPROVE",
            "applicantUserId", applicantId,
            "targetNodeId", nodeId,
            "applicationType", "PROJECT",
            "title", "T10 苏绣项目申报",
            "formData", Map.of("projectLevel", "省级", "summary", "申报审核闭环测试"),
            "currentStep", 2
        );

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("applicationNo", "TEST-T10-APPROVE");
        assertThat(created.getBody()).containsEntry("status", "DRAFT");
        Number approvedApplicationId = (Number) created.getBody().get("id");

        ResponseEntity<Map> submitted = restTemplate.exchange(
            url("/api/applications/" + approvedApplicationId.longValue() + "/submit"),
            HttpMethod.PUT,
            adminEmptyEntity(),
            Map.class
        );
        assertThat(submitted.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(submitted.getBody()).containsEntry("status", "SUBMITTED");
        assertThat(submitted.getBody()).containsEntry("currentStep", 2);
        assertThat(submitted.getBody()).containsKey("submittedAt");

        Map<String, Object> submittedList = getAsAdmin("/api/applications?keyword=T10&status=SUBMITTED&page=1&size=10");
        assertThat(submittedList).containsEntry("total", 1);
        assertThat(submittedList.get("items").toString()).contains("测试申报人", "T10 苏绣项目申报", "T10 申报节点");

        ResponseEntity<Map> approved = restTemplate.exchange(
            url("/api/applications/" + approvedApplicationId.longValue() + "/approve"),
            HttpMethod.PUT,
            adminEntity(Map.of("reviewerId", reviewerId, "reviewComment", "材料完整，同意入库")),
            Map.class
        );
        assertThat(approved.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(approved.getBody()).containsEntry("status", "APPROVED");
        assertThat(approved.getBody()).containsEntry("reviewComment", "材料完整，同意入库");

        Map<String, Object> approvedDetail = getAsAdmin("/api/applications/" + approvedApplicationId.longValue());
        assertThat(approvedDetail.get("reviewLogs").toString()).contains("SUBMITTED", "APPROVED", "材料完整，同意入库", "测试审核员");

        Map<String, Object> rejectRequest = Map.of(
            "applicationNo", "TEST-T10-REJECT",
            "applicantUserId", applicantId,
            "applicationType", "MEDIA",
            "title", "T10 影像资料申报",
            "formData", Map.of("materialCount", 3),
            "currentStep", 1
        );
        ResponseEntity<Map> rejectDraft = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(rejectRequest),
            Map.class
        );
        Number rejectedApplicationId = (Number) rejectDraft.getBody().get("id");
        restTemplate.exchange(url("/api/applications/" + rejectedApplicationId.longValue() + "/submit"), HttpMethod.PUT, adminEmptyEntity(), Map.class);

        ResponseEntity<Map> rejected = restTemplate.exchange(
            url("/api/applications/" + rejectedApplicationId.longValue() + "/reject"),
            HttpMethod.PUT,
            adminEntity(Map.of("reviewerId", reviewerId, "reviewComment", "缺少版权授权材料")),
            Map.class
        );

        assertThat(rejected.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(rejected.getBody()).containsEntry("status", "REJECTED");
        assertThat(rejected.getBody()).containsEntry("reviewComment", "缺少版权授权材料");
    }

    @Test
    void inheritorCanCreateAndSubmitOnlyOwnApplicationsButCannotReview() {
        long inheritorId = insertTestUser("test_app_inheritor", "T App Inheritor", "INHERITOR");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'INHERITOR'
            on duplicate key update user_id = values(user_id)
            """, inheritorId);
        long otherId = insertTestUser("test_app_other", "T App Other", "INHERITOR");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'INHERITOR'
            on duplicate key update user_id = values(user_id)
            """, otherId);

        String inheritorToken = loginToken("test_app_inheritor");
        String otherToken = loginToken("test_app_other");

        ResponseEntity<Map> initialList = restTemplate.exchange(
            url("/api/applications?applicationType=PROJECT&page=1&size=10"),
            HttpMethod.GET,
            adminEmptyEntityForToken(inheritorToken),
            Map.class
        );
        assertThat(initialList.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(initialList.getBody()).containsEntry("total", 0);

        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long forbiddenTargetNodeId = insertTestNode("test_inheritor_forbidden_target", projectTypeId, "T App Forbidden Target");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of(
                "applicationNo", "TEST-INHERITOR-OWNED",
                "applicantUserId", otherId,
                "applicationType", "MEDIA",
                "targetNodeId", forbiddenTargetNodeId,
                "title", "T App Inheritor Owned Project",
                "formData", Map.of("summary", "owned application")
            )),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(((Number) created.getBody().get("applicantUserId")).longValue()).isEqualTo(inheritorId);
        assertThat(created.getBody()).containsEntry("applicationType", "PROJECT");
        assertThat(created.getBody()).doesNotContainKeys("targetNodeId", "targetNodeCode", "targetNodeName");
        Number applicationId = (Number) created.getBody().get("id");

        ResponseEntity<Map> ownerList = restTemplate.exchange(
            url("/api/applications?applicationType=PROJECT&page=1&size=10"),
            HttpMethod.GET,
            adminEmptyEntityForToken(inheritorToken),
            Map.class
        );
        assertThat(ownerList.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ownerList.getBody()).containsEntry("total", 1);
        assertThat(ownerList.getBody().get("items").toString()).contains("T App Inheritor Owned Project");

        ResponseEntity<Map> updated = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue()),
            HttpMethod.PUT,
            bearerEntity(inheritorToken, Map.of(
                "applicationNo", "TEST-INHERITOR-OWNED",
                "applicationType", "RELATION",
                "targetNodeId", forbiddenTargetNodeId,
                "title", "T App Inheritor Updated Project",
                "formData", Map.of("summary", "updated own draft")
            )),
            Map.class
        );
        assertThat(updated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(updated.getBody()).containsEntry("title", "T App Inheritor Updated Project");
        assertThat(updated.getBody()).containsEntry("applicationType", "PROJECT");
        assertThat(updated.getBody()).doesNotContainKeys("targetNodeId", "targetNodeCode", "targetNodeName");

        ResponseEntity<Map> deleteDraft = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue()),
            HttpMethod.DELETE,
            bearerEntity(inheritorToken, Map.of()),
            Map.class
        );
        assertThat(deleteDraft.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> afterDeleteList = restTemplate.exchange(
            url("/api/applications?applicationType=PROJECT&page=1&size=10"),
            HttpMethod.GET,
            adminEmptyEntityForToken(inheritorToken),
            Map.class
        );
        assertThat(afterDeleteList.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(afterDeleteList.getBody()).containsEntry("total", 0);

        ResponseEntity<Map> resubmittableDraft = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of(
                "applicationNo", "TEST-INHERITOR-SUBMIT",
                "applicationType", "PROJECT",
                "title", "T App Inheritor Submit Project",
                "formData", Map.of("summary", "submit application")
            )),
            Map.class
        );
        assertThat(resubmittableDraft.getStatusCode().is2xxSuccessful()).isTrue();
        applicationId = (Number) resubmittableDraft.getBody().get("id");

        ResponseEntity<Map> submitted = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue() + "/submit"),
            HttpMethod.PUT,
            bearerEntity(inheritorToken, Map.of()),
            Map.class
        );
        assertThat(submitted.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(submitted.getBody()).containsEntry("status", "SUBMITTED");

        ResponseEntity<Map> otherDetail = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue()),
            HttpMethod.GET,
            adminEmptyEntityForToken(otherToken),
            Map.class
        );
        assertThat(otherDetail.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> inheritorApprove = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue() + "/approve"),
            HttpMethod.PUT,
            bearerEntity(inheritorToken, Map.of("reviewComment", "not allowed")),
            Map.class
        );
        assertThat(inheritorApprove.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void applicationsAcceptApplicantUsernameInsteadOfNumericUserId() {
        insertTestUser("test_t10_username_applicant", "T10 Username Applicant", "NORMAL");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "applicationNo", "TEST-T10-USERNAME",
                "applicantUsername", "test_t10_username_applicant",
                "applicationType", "PROJECT",
                "title", "T10 Username Application",
                "currentStep", 1
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("applicantName", "T10 Username Applicant");
        assertThat(created.getBody()).containsEntry("status", "DRAFT");
    }

    @Test
    void applicationsDefaultApplicantToAdminWhenUsernameIsBlank() {
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T10 Default Applicant Draft",
                "applicationType", "PROJECT",
                "currentStep", 1
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("applicantName", "管理员");
        assertThat(created.getBody().get("applicationNo").toString()).startsWith("APP-");
    }

    @Test
    void adminCanEditReviewAndDeleteApplications() {
        long applicantId = insertTestUser("test_applicant_t10_manage", "T10 Manage Applicant", "NORMAL");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "applicationNo", "TEST-T10-MANAGE",
                "applicantUserId", applicantId,
                "applicationType", "PROJECT",
                "title", "T10 Manage Draft",
                "formData", Map.of("summary", "before edit"),
                "currentStep", 1
            )),
            Map.class
        );
        Number applicationId = (Number) created.getBody().get("id");

        ResponseEntity<Map> edited = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue()),
            HttpMethod.PUT,
            adminEntity(Map.of(
                "applicationNo", "TEST-T10-MANAGE",
                "applicantUserId", applicantId,
                "applicationType", "PROJECT",
                "title", "T10 Managed Project",
                "formData", Map.of("summary", "after edit", "projectLevel", "city"),
                "currentStep", 3
            )),
            Map.class
        );
        assertThat(edited.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(edited.getBody()).containsEntry("title", "T10 Managed Project");
        assertThat(edited.getBody()).containsEntry("currentStep", 3);
        assertThat(edited.getBody().get("formData").toString()).contains("after edit");

        restTemplate.exchange(url("/api/applications/" + applicationId.longValue() + "/submit"), HttpMethod.PUT, adminEmptyEntity(), Map.class);
        ResponseEntity<Map> approved = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue() + "/approve"),
            HttpMethod.PUT,
            adminEntity(Map.of("reviewComment", "fallback reviewer approves")),
            Map.class
        );
        assertThat(approved.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(approved.getBody()).containsEntry("status", "APPROVED");
        assertThat(approved.getBody()).containsKey("targetNodeId");

        Number targetNodeId = (Number) approved.getBody().get("targetNodeId");
        Map<String, Object> nodeDetail = getAsAdmin("/api/graph/nodes/" + targetNodeId.longValue());
        assertThat(nodeDetail).containsEntry("name", "T10 Managed Project");

        ResponseEntity<Void> deleted = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue()),
            HttpMethod.DELETE,
            adminEmptyEntity(),
            Void.class
        );
        assertThat(deleted.getStatusCode().is2xxSuccessful()).isTrue();

        Map<String, Object> list = getAsAdmin("/api/applications?keyword=TEST-T10-MANAGE&page=1&size=10");
        assertThat(list).containsEntry("total", 0);
    }

    @Test
    void approvedApplicationWithoutTargetNodeCreatesManageableGraphNode() {
        long applicantId = insertTestUser("test_applicant_t10_ingest", "T10 Ingest Applicant", "INHERITOR");
        long reviewerId = insertTestUser("test_reviewer_t10_ingest", "T10 Ingest Reviewer", "SUPER_ADMIN");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/applications"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "applicationNo", "TEST-T10-INGEST",
                "applicantUserId", applicantId,
                "applicationType", "PROJECT",
                "title", "T10 Auto Ingest Project",
                "formData", Map.of("projectLevel", "provincial", "summary", "approved applications should create graph nodes"),
                "currentStep", 3
            )),
            Map.class
        );
        Number applicationId = (Number) created.getBody().get("id");
        restTemplate.exchange(url("/api/applications/" + applicationId.longValue() + "/submit"), HttpMethod.PUT, adminEmptyEntity(), Map.class);

        ResponseEntity<Map> approved = restTemplate.exchange(
            url("/api/applications/" + applicationId.longValue() + "/approve"),
            HttpMethod.PUT,
            adminEntity(Map.of("reviewerId", reviewerId, "reviewComment", "approve and ingest")),
            Map.class
        );

        assertThat(approved.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(approved.getBody()).containsEntry("status", "APPROVED");
        assertThat(approved.getBody()).containsEntry("currentStep", 4);
        assertThat(approved.getBody()).containsKey("targetNodeId");
        assertThat(approved.getBody()).containsEntry("targetNodeName", "T10 Auto Ingest Project");

        Number targetNodeId = (Number) approved.getBody().get("targetNodeId");
        Map<String, Object> nodeDetail = getAsAdmin("/api/graph/nodes/" + targetNodeId.longValue());
        assertThat(nodeDetail).containsEntry("name", "T10 Auto Ingest Project");
        assertThat(nodeDetail).containsEntry("nodeCode", "application_TEST-T10-INGEST");

        Map<String, Object> nodeList = getAsAdmin("/api/graph/nodes?keyword=application_TEST-T10-INGEST&page=1&size=10");
        assertThat(nodeList).containsEntry("total", 1);
        assertThat(nodeList.get("items").toString()).contains("application_TEST-T10-INGEST", "T10 Auto Ingest Project");
    }

    @Test
    void communityQaSupportsModerationAnswerCommentAndLikeFlow() {
        long askerId = insertTestUser("test_t11_asker", "T11 提问用户", "NORMAL");
        long inheritorUserId = insertTestUser("test_t11_inheritor_user", "T11 传承人用户", "INHERITOR");
        String askerToken = loginToken("test_t11_asker");
        String inheritorToken = loginToken("test_t11_inheritor_user");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);
        long projectId = insertTestNode("test_t11_project", projectTypeId, "T11 苏绣问答项目");
        long inheritorNodeId = insertTestNode("test_t11_inheritor", inheritorTypeId, "T11 李老师");
        insertTestEdge(projectId, inheritorNodeId, hasInheritorTypeId, "传承人");
        jdbcTemplate.update("insert into sensitive_words (word, word_type, severity) values ('test_t11_blocked', 'COMMUNITY', 2)");

        Map<String, Object> blockedQuestionRequest = Map.of(
            "nodeId", projectId,
            "authorId", askerId,
            "title", "T11 test_t11_blocked 内容",
            "content", "这个问题应该被敏感词拦截"
        );
        ResponseEntity<Map> blocked = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            bearerEntity(askerToken, blockedQuestionRequest),
            Map.class
        );
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Integer blockedRecords = jdbcTemplate.queryForObject(
            "select count(*) from content_review_records where content_type = 'QUESTION' and status = 'BLOCKED' and raw_content like '%test_t11_blocked%'",
            Integer.class
        );
        assertThat(blockedRecords).isEqualTo(1);

        Map<String, Object> questionRequest = Map.of(
            "nodeId", projectId,
            "authorId", askerId,
            "title", "T11 苏绣针法如何入门",
            "content", "想了解苏绣基础针法与练习顺序。",
            "imageUrl", "data:image/png;base64,dGVzdC10MTEtcXVlc3Rpb24taW1hZ2U="
        );
        ResponseEntity<Map> createdQuestion = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            bearerEntity(askerToken, questionRequest),
            Map.class
        );
        assertThat(createdQuestion.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdQuestion.getBody()).containsEntry("title", "T11 苏绣针法如何入门");
        assertThat(createdQuestion.getBody()).containsEntry("status", "PUBLISHED");
        assertThat(createdQuestion.getBody()).containsEntry("imageUrl", "data:image/png;base64,dGVzdC10MTEtcXVlc3Rpb24taW1hZ2U=");
        assertThat(createdQuestion.getBody().get("relatedInheritors").toString()).contains("T11 李老师");
        Number questionId = (Number) createdQuestion.getBody().get("id");

        Map<String, Object> questionList = get("/api/community/questions?keyword=T11&page=1&size=10");
        assertThat(questionList).containsEntry("total", 1);
        assertThat(questionList.get("items").toString()).contains("T11 提问用户", "T11 苏绣问答项目");
        assertThat(questionList.get("items").toString()).contains("data:image/png;base64,dGVzdC10MTEtcXVlc3Rpb24taW1hZ2U=");

        Map<String, Object> answerRequest = Map.of(
            "authorId", inheritorUserId,
            "content", "先从平针、套针练起，再观察线色过渡。"
        );
        ResponseEntity<Map> createdAnswer = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/answers"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, answerRequest),
            Map.class
        );
        assertThat(createdAnswer.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdAnswer.getBody()).containsEntry("authorName", "T11 传承人用户");
        Number answerId = (Number) createdAnswer.getBody().get("id");

        Map<String, Object> commentRequest = Map.of(
            "authorId", askerId,
            "content", "谢谢老师，准备从平针开始练习。"
        );
        ResponseEntity<Map> createdComment = restTemplate.exchange(
            url("/api/community/answers/" + answerId.longValue() + "/comments"),
            HttpMethod.POST,
            bearerEntity(askerToken, commentRequest),
            Map.class
        );
        assertThat(createdComment.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdComment.getBody()).containsEntry("targetType", "ANSWER");

        ResponseEntity<Map> liked = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/likes"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("userId", askerId)),
            Map.class
        );
        assertThat(liked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(liked.getBody()).containsEntry("likeCount", 1);
        ResponseEntity<Map> toggleOff = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/likes"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("userId", askerId)),
            Map.class
        );
        assertThat(toggleOff.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(toggleOff.getBody()).containsEntry("liked", false);
        assertThat(toggleOff.getBody()).containsEntry("likeCount", 0);
        ResponseEntity<Map> reliked = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/likes"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("userId", askerId)),
            Map.class
        );
        assertThat(reliked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(reliked.getBody()).containsEntry("liked", true);
        assertThat(reliked.getBody()).containsEntry("likeCount", 1);

        Map<String, Object> detail = get("/api/community/questions/" + questionId.longValue());
        assertThat(detail).containsEntry("answerCount", 1);
        assertThat(detail).containsEntry("likeCount", 1);
        assertThat(detail).containsEntry("imageUrl", "data:image/png;base64,dGVzdC10MTEtcXVlc3Rpb24taW1hZ2U=");
        assertThat(detail.get("answers").toString()).contains("先从平针", "T11 传承人用户");
        assertThat(detail.get("comments").toString()).contains("谢谢老师");
    }

    @Test
    void communityMutationsUseBearerUserInsteadOfSubmittedUserIds() {
        long askerId = insertTestUser("test_t11_token_asker", "T11 Token Asker", "NORMAL");
        long otherUserId = insertTestUser("test_t11_token_other", "T11 Token Other", "NORMAL");
        long inheritorId = insertTestUser("test_t11_token_inheritor", "T11 Token Inheritor", "INHERITOR");
        String askerToken = loginToken("test_t11_token_asker");
        String inheritorToken = loginToken("test_t11_token_inheritor");

        ResponseEntity<Map> createdQuestion = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of(
                "authorId", otherUserId,
                "title", "T11 Token question",
                "content", "question should use the bearer user"
            )),
            Map.class
        );
        assertThat(createdQuestion.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdQuestion.getBody()).containsEntry("authorName", "T11 Token Asker");
        Number questionId = (Number) createdQuestion.getBody().get("id");

        ResponseEntity<Map> createdAnswer = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/answers"),
            HttpMethod.POST,
            bearerEntity(inheritorToken, Map.of(
                "authorId", askerId,
                "content", "answer should use the bearer inheritor"
            )),
            Map.class
        );
        assertThat(createdAnswer.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdAnswer.getBody()).containsEntry("authorName", "T11 Token Inheritor");
        Number answerId = (Number) createdAnswer.getBody().get("id");

        ResponseEntity<Map> createdComment = restTemplate.exchange(
            url("/api/community/answers/" + answerId.longValue() + "/comments"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("authorId", otherUserId, "content", "comment uses bearer user")),
            Map.class
        );
        assertThat(createdComment.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(createdComment.getBody()).containsEntry("authorName", "T11 Token Asker");

        ResponseEntity<Map> liked = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/likes"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("userId", otherUserId)),
            Map.class
        );
        assertThat(liked.getStatusCode().is2xxSuccessful()).isTrue();

        ResponseEntity<Map> toggleOff = restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue() + "/likes"),
            HttpMethod.POST,
            bearerEntity(askerToken, Map.of("userId", otherUserId)),
            Map.class
        );
        assertThat(toggleOff.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(toggleOff.getBody()).containsEntry("liked", false);
        assertThat(toggleOff.getBody()).containsEntry("likeCount", 0);
    }

    @Test
    void learningRecommendationAndCheckinReachT13() {
        long learnerId = insertTestUser("test_t13_learner", "T13 Learner", "NORMAL");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long unescoTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'unesco_element'", Long.class);
        long nodeA = insertTestNode("demo_t13_kunqu", projectTypeId, "昆曲研习项目");
        long nodeB = insertTestNode("demo_t13_suxiu", projectTypeId, "苏绣体验工坊");
        long localizedNode = insertTestNode("demo_t13_guqin", unescoTypeId, "Guqin Art");
        // 推荐候选按 popularity_count 取前 N，库中已有真实项目（湖南种子）也有热度值，
        // 因此夹具必须明显高于现有数据，避免测试依赖“库里没有更热的节点”这一脆弱前提。
        jdbcTemplate.update("update graph_nodes set alias = 'T13 中文展示名', popularity_count = 5000 where id = ?", localizedNode);
        jdbcTemplate.update("update graph_nodes set popularity_count = 4000 where id = ?", nodeA);
        jdbcTemplate.update("update graph_nodes set popularity_count = 3000 where id = ?", nodeB);

        ResponseEntity<Map> generated = restTemplate.exchange(
            url("/api/learning/recommendations/generate?date=2026-06-23&limit=3"),
            HttpMethod.POST,
            adminEntity(Map.of()),
            Map.class
        );

        assertThat(generated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(generated.getBody()).containsEntry("recommendDate", "2026-06-23");
        assertThat(generated.getBody().get("title").toString()).contains("每日推荐");
        assertThat(generated.getBody().get("title").toString()).doesNotContain("T13 Daily Recommendation");
        assertThat(generated.getBody()).containsEntry("total", 3);
        assertThat(generated.getBody().get("items").toString()).contains("demo_t13_kunqu", "demo_t13_suxiu");
        assertThat(generated.getBody().get("items").toString()).contains("昆曲研习项目", "苏绣体验工坊");
        assertThat(generated.getBody().get("items").toString()).contains("T13 中文展示名");
        assertThat(generated.getBody().get("items").toString()).contains("热度", "适合今日学习");
        assertThat(generated.getBody().get("items").toString()).doesNotContain("????", "鐑", "姣忔棩");
        assertThat(generated.getBody().get("items").toString()).doesNotContain("Guqin Art");
        assertThat(generated.getBody().get("items").toString()).doesNotContain("T17 Heritage Market", "T17 public exhibition");
        Number recommendationId = (Number) generated.getBody().get("id");

        ResponseEntity<Map> duplicateGeneration = restTemplate.exchange(
            url("/api/learning/recommendations/generate?date=2026-06-23&limit=3"),
            HttpMethod.POST,
            adminEntity(Map.of()),
            Map.class
        );
        assertThat(duplicateGeneration.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(duplicateGeneration.getBody()).containsEntry("id", recommendationId.intValue());
        Integer batchCount = jdbcTemplate.queryForObject(
            "select count(*) from daily_recommendations where recommend_date = '2026-06-23'",
            Integer.class
        );
        assertThat(batchCount).isEqualTo(1);

        Map<String, Object> hot = get("/api/learning/hot?limit=3");
        assertThat(hot).containsEntry("total", 3);
        assertThat(hot.get("items").toString()).contains("demo_t13_kunqu", "demo_t13_suxiu", "T13 中文展示名");
        assertThat(hot.get("items").toString()).doesNotContain("Guqin Art");

        ResponseEntity<Map> dayOne = restTemplate.postForEntity(
            url("/api/learning/checkins"),
            Map.of("userId", learnerId, "date", "2026-06-23"),
            Map.class
        );
        assertThat(dayOne.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(dayOne.getBody()).containsEntry("checkinDate", "2026-06-23");
        assertThat(dayOne.getBody()).containsEntry("continuousDays", 1);

        ResponseEntity<Map> duplicateCheckin = restTemplate.postForEntity(
            url("/api/learning/checkins"),
            Map.of("userId", learnerId, "date", "2026-06-23"),
            Map.class
        );
        assertThat(duplicateCheckin.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<Map> dayTwo = restTemplate.postForEntity(
            url("/api/learning/checkins"),
            Map.of("userId", learnerId, "date", "2026-06-24"),
            Map.class
        );
        assertThat(dayTwo.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(dayTwo.getBody()).containsEntry("continuousDays", 2);

        Map<String, Object> calendar = get("/api/learning/checkins?userId=" + learnerId + "&month=2026-06");
        assertThat(calendar).containsEntry("total", 2);
        assertThat(calendar).containsEntry("currentStreak", 2);
        assertThat(calendar.get("items").toString()).contains("2026-06-23", "2026-06-24");
    }

    @Test
    void learningCheckinsAcceptUsernameInsteadOfNumericUserId() {
        insertTestUser("test_t13_username_learner", "T13 Username Learner", "NORMAL");

        ResponseEntity<Map> checkin = restTemplate.postForEntity(
            url("/api/learning/checkins"),
            Map.of("username", "test_t13_username_learner", "date", "2026-06-23"),
            Map.class
        );

        assertThat(checkin.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(checkin.getBody()).containsEntry("checkinDate", "2026-06-23");
        Map<String, Object> calendar = get("/api/learning/checkins?username=test_t13_username_learner&month=2026-06");
        assertThat(calendar).containsEntry("total", 1);
    }

    @Test
    void favoritesAndPersonalGraphReachT12() {
        long userId = insertTestUser("test_t12_collector", "T12 Collector", "NORMAL");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long hasInheritorTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'has_inheritor'", Long.class);
        long projectId = insertTestNode("test_t12_project", projectTypeId, "T12 Favorite Project");
        long inheritorId = insertTestNode("test_t12_inheritor", inheritorTypeId, "T12 Public Inheritor");
        long privateNodeId = insertTestNode("test_t12_private", inheritorTypeId, "T12 Private Draft");
        jdbcTemplate.update("update graph_nodes set province = '江苏省', city = '苏州市', popularity_count = 12 where id = ?", projectId);
        jdbcTemplate.update("update graph_nodes set visibility = 'PRIVATE', audit_status = 'DRAFT' where id = ?", privateNodeId);
        insertTestEdge(projectId, inheritorId, hasInheritorTypeId, "T12 has inheritor");
        insertTestEdge(projectId, privateNodeId, hasInheritorTypeId, "T12 private relation");

        Map<String, Object> favoriteRequest = Map.of(
            "userId", userId,
            "nodeId", projectId,
            "note", "T12 focus on training lineage"
        );
        ResponseEntity<Map> created = restTemplate.postForEntity(url("/api/favorites/nodes"), favoriteRequest, Map.class);

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("nodeId", (int) projectId);
        assertThat(created.getBody()).containsEntry("nodeName", "T12 Favorite Project");
        assertThat(created.getBody()).containsKeys("nodeTypeColor", "province", "city", "popularityCount");
        assertThat(created.getBody()).containsEntry("note", "T12 focus on training lineage");

        ResponseEntity<Map> duplicate = restTemplate.postForEntity(url("/api/favorites/nodes"), favoriteRequest, Map.class);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        Map<String, Object> updated = restTemplate.exchange(
            url("/api/favorites/nodes/" + projectId),
            HttpMethod.PUT,
            new HttpEntity<>(Map.of("userId", userId, "note", "T12 updated private note")),
            Map.class
        ).getBody();
        assertThat(updated).containsEntry("note", "T12 updated private note");
        assertThat(updated).containsKeys("nodeTypeColor", "province", "city", "popularityCount");

        Map<String, Object> list = get("/api/favorites/nodes?userId=" + userId + "&keyword=T12&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("T12 Favorite Project", "T12 updated private note");

        Map<String, Object> graph = get("/api/favorites/graph?userId=" + userId);
        assertThat(graph).containsEntry("nodeCount", 2);
        assertThat(graph).containsEntry("edgeCount", 1);
        assertThat(graph.get("nodes").toString()).contains("test_t12_project", "test_t12_inheritor");
        assertThat(graph.get("nodes").toString()).doesNotContain("test_t12_private");
        assertThat(graph.get("edges").toString()).contains("T12 has inheritor");
        assertThat(graph.get("edges").toString()).doesNotContain("T12 private relation");

        restTemplate.exchange(url("/api/favorites/nodes/" + projectId + "?userId=" + userId), HttpMethod.DELETE, HttpEntity.EMPTY, Void.class);
        Map<String, Object> afterDelete = get("/api/favorites/nodes?userId=" + userId + "&keyword=T12&page=1&size=10");
        assertThat(afterDelete).containsEntry("total", 0);
    }

    @Test
    void favoritesAcceptUsernameInsteadOfNumericUserId() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t12_username_favorite", projectTypeId, "T12 Username Favorite");
        insertTestUser("test_t12_username_user", "T12 Username User", "NORMAL");

        ResponseEntity<Map> created = restTemplate.postForEntity(
            url("/api/favorites/nodes"),
            Map.of(
                "username", "test_t12_username_user",
                "nodeId", nodeId,
                "note", "T12 username note"
            ),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("nodeName", "T12 Username Favorite");
        Map<String, Object> list = get("/api/favorites/nodes?username=test_t12_username_user&keyword=T12&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        restTemplate.exchange(
            url("/api/favorites/nodes/" + nodeId + "?username=test_t12_username_user"),
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            Void.class
        );
        Map<String, Object> afterDelete = get("/api/favorites/nodes?username=test_t12_username_user&keyword=T12&page=1&size=10");
        assertThat(afterDelete).containsEntry("total", 0);
    }

    @Test
    void creativeProductsAndReviewsReachT14() {
        long ownerId = insertTestUser("test_t14_owner", "T14 Owner", "INHERITOR");
        long reviewerA = insertTestUser("test_t14_reviewer_a", "T14 Reviewer A", "NORMAL");
        long reviewerB = insertTestUser("test_t14_reviewer_b", "T14 Reviewer B", "NORMAL");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t14_project", projectTypeId, "T14 Product Source Node");
        jdbcTemplate.update("""
            insert into media_files (bucket_name, object_key, original_name, file_type, content_type, file_size, preview_url, visibility, audit_status)
            values ('test', 'test/t14-product-cover.jpg', 't14-product-cover.jpg', 'IMAGE', 'image/jpeg', 1024, '/uploads/media/test/t14-product-cover.jpg', 'PUBLIC', 'APPROVED')
            """);
        long coverFileId = jdbcTemplate.queryForObject(
            "select id from media_files where object_key = 'test/t14-product-cover.jpg'",
            Long.class
        );
        jdbcTemplate.update("insert into sensitive_words (word, word_type, severity) values ('test_t14_blocked', 'PRODUCT', 2)");

        Map<String, Object> createRequest = Map.of(
            "productCode", "test_t14_product",
            "name", "T14 Silk Notebook",
            "description", "## 工艺亮点\n- 手工装帧\n**苏绣纹样**",
            "coverFileId", coverFileId,
            "relatedNodeId", nodeId,
            "ownerUserId", ownerId,
            "externalUrl", "https://example.test/products/t14",
            "price", 128.5,
            "status", "APPROVED"
        );
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/products"),
            HttpMethod.POST,
            adminEntity(createRequest),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("productCode", "test_t14_product");
        assertThat(created.getBody()).containsEntry("relatedNodeName", "T14 Product Source Node");
        assertThat(((Number) created.getBody().get("coverFileId")).longValue()).isEqualTo(coverFileId);
        assertThat(created.getBody()).containsEntry("coverUrl", "/uploads/media/test/t14-product-cover.jpg");
        assertThat(created.getBody().get("description").toString()).contains("## 工艺亮点", "**苏绣纹样**");
        Number productId = (Number) created.getBody().get("id");
        Integer persistedProductRows = jdbcTemplate.queryForObject(
            "select count(*) from creative_products where id = ? and product_code = 'test_t14_product' and deleted = 0",
            Integer.class,
            productId.longValue()
        );
        assertThat(persistedProductRows)
            .as("new creative product records must be persisted in creative_products")
            .isEqualTo(1);

        Map<String, Object> productList = get("/api/products?keyword=T14&sort=rating&page=1&size=10");
        assertThat(productList).containsEntry("total", 1);
        assertThat(productList.get("items").toString()).contains("T14 Silk Notebook", "T14 Product Source Node");
        assertThat(productList.get("items").toString()).contains("/uploads/media/test/t14-product-cover.jpg", "## 工艺亮点");

        ResponseEntity<Map> reviewA = restTemplate.exchange(
            url("/api/products/" + productId.longValue() + "/reviews"),
            HttpMethod.POST,
            bearerEntity(loginToken("test_t14_reviewer_a"), Map.of("rating", 5, "content", "T14 excellent craft detail")),
            Map.class
        );
        assertThat(reviewA.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(reviewA.getBody()).containsEntry("rating", 5);

        ResponseEntity<Map> reviewB = restTemplate.exchange(
            url("/api/products/" + productId.longValue() + "/reviews"),
            HttpMethod.POST,
            bearerEntity(loginToken("test_t14_reviewer_b"), Map.of("rating", 3, "content", "T14 solid museum gift")),
            Map.class
        );
        assertThat(reviewB.getStatusCode().is2xxSuccessful()).isTrue();

        Map<String, Object> detail = get("/api/products/" + productId.longValue());
        assertThat(detail).containsEntry("coverUrl", "/uploads/media/test/t14-product-cover.jpg");
        assertThat(detail.get("description").toString()).contains("## 工艺亮点", "**苏绣纹样**");
        assertThat(((Number) detail.get("averageRating")).doubleValue()).isEqualTo(4.0);
        assertThat(detail).containsEntry("ratingCount", 2);
        assertThat(detail.get("reviews").toString()).contains("T14 excellent craft detail", "T14 solid museum gift");

        insertTestUser("test_t14_blocked_user", "T14 Blocked User", "NORMAL");
        ResponseEntity<Map> blocked = restTemplate.exchange(
            url("/api/products/" + productId.longValue() + "/reviews"),
            HttpMethod.POST,
            bearerEntity(loginToken("test_t14_blocked_user"), Map.of("rating", 4, "content", "T14 test_t14_blocked review")),
            Map.class
        );
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Integer blockedRecords = jdbcTemplate.queryForObject(
            "select count(*) from content_review_records where content_type = 'PRODUCT_REVIEW' and status = 'BLOCKED' and raw_content like '%test_t14_blocked%'",
            Integer.class
        );
        assertThat(blockedRecords).isEqualTo(1);
        assertThat(get("/api/products/" + productId.longValue()).get("reviews").toString()).doesNotContain("test_t14_blocked");
    }

    @Test
    void productsAcceptUsernameForOwnerBinding() {
        long ownerId = insertTestUser("test_t14_username_owner", "T14 Username Owner", "INHERITOR");
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t14_username_product_node", projectTypeId, "T14 Username Product Node");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/products"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "productCode", "test_t14_username_product",
                "name", "T14 Username Product",
                "relatedNodeId", nodeId,
                "ownerUsername", "test_t14_username_owner",
                "price", 88.0,
                "status", "APPROVED"
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("ownerName", "T14 Username Owner");
        assertThat(((Number) created.getBody().get("ownerUserId")).longValue()).isEqualTo(ownerId);
    }

    @Test
    void productsDefaultCodeAndOwnerToAdminWhenFormOmitsBackendFields() {
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/products"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "name", "Default Owner Product",
                "description", "Created from a simplified admin form",
                "price", 36.0,
                "status", "APPROVED"
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody().get("productCode").toString()).startsWith("product_");
        assertThat(created.getBody()).containsEntry("ownerName", "管理员");
    }

    @Test
    void analyticsDashboardAndMapReachT15() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long regionTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'region'", Long.class);
        long originatedInTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'originated_in'", Long.class);

        long jiangsuProject = insertTestNode("test_t15_suxiu", projectTypeId, "T15 Jiangsu Project");
        long zhejiangProject = insertTestNode("test_t15_yueju", projectTypeId, "T15 Zhejiang Project");
        long jiangsuRegion = insertTestNode("test_t15_suzhou_region", regionTypeId, "T15 Suzhou Region");
        long youngInheritor = insertTestNode("test_t15_young_inheritor", inheritorTypeId, "T15 Young Inheritor");
        long seniorInheritor = insertTestNode("test_t15_senior_inheritor", inheritorTypeId, "T15 Senior Inheritor");
        jdbcTemplate.update("update graph_nodes set province = '江苏省', city = '苏州市', longitude = 120.5853, latitude = 31.2989, popularity_count = 70 where id in (?, ?)", jiangsuProject, jiangsuRegion);
        jdbcTemplate.update("update graph_nodes set province = '浙江省', city = '杭州市', longitude = 120.1551, latitude = 30.2741, popularity_count = 35 where id = ?", zhejiangProject);
        jdbcTemplate.update("update graph_nodes set province = '江苏省', extra_attrs = json_object('birthYear', 1992) where id = ?", youngInheritor);
        jdbcTemplate.update("update graph_nodes set province = '浙江省', extra_attrs = json_object('birthYear', 1958) where id = ?", seniorInheritor);
        insertTestEdge(jiangsuProject, jiangsuRegion, originatedInTypeId, "T15 originated in Suzhou");

        Map<String, Object> overview = getAsAdmin("/api/analytics/overview");

        assertThat(overview.get("categoryShare").toString()).contains("heritage_project", "inheritor");
        assertThat(overview.get("ageBuckets").toString()).contains("20-39", "60+");
        assertThat(overview.get("provinceHeatmap").toString()).contains("江苏省", "浙江省");
        assertThat(overview.get("propagationTracks").toString()).contains("T15 Jiangsu Project", "T15 Suzhou Region", "T15 originated in Suzhou");

        Integer sqlJiangsuCount = jdbcTemplate.queryForObject(
            "select count(*) from graph_nodes where province = '江苏省' and deleted = 0 and status = 1 and visibility = 'PUBLIC' and audit_status = 'APPROVED'",
            Integer.class
        );
        List<Map<String, Object>> heatmap = (List<Map<String, Object>>) overview.get("provinceHeatmap");
        Number apiJiangsuCount = (Number) heatmap.stream()
            .filter(item -> "江苏省".equals(item.get("province")))
            .findFirst()
            .orElseThrow()
            .get("nodeCount");
        assertThat(apiJiangsuCount.intValue()).isEqualTo(sqlJiangsuCount);
    }

    @Test
    void graphNodeBirthYearFeedsAnalyticsAgeBuckets() {
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/graph/nodes"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "nodeCode", "test_t15_birth_year_inheritor",
                "nodeTypeId", inheritorTypeId,
                "name", "T15 Birth Year Inheritor",
                "province", "江苏省",
                "birthYear", 1996,
                "visibility", "PUBLIC",
                "auditStatus", "APPROVED"
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("birthYear", 1996);
        Number nodeId = (Number) created.getBody().get("id");

        ResponseEntity<Map> updated = restTemplate.exchange(
            url("/api/graph/nodes/" + nodeId.longValue()),
            HttpMethod.PUT,
            adminEntity(Map.of(
                "name", "T15 Birth Year Inheritor",
                "province", "江苏省",
                "birthYear", 1956,
                "visibility", "PUBLIC",
                "auditStatus", "APPROVED"
            )),
            Map.class
        );

        assertThat(updated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(updated.getBody()).containsEntry("birthYear", 1956);

        Map<String, Object> overview = getAsAdmin("/api/analytics/overview");
        assertThat(overview.get("ageBuckets").toString()).contains("60+", "nodeCount");
    }

    @Test
    void articlesSupportPublishingPortalVisibilityAndOperationAudit() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t16_article_node", projectTypeId, "T16 Article Node");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/articles"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T16 Study Article",
                "summary", "T16 short study summary",
                "content", "T16 long form study content",
                "articleType", "STUDY",
                "relatedNodeId", nodeId,
                "status", "DRAFT"
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("title", "T16 Study Article");
        assertThat(created.getBody()).containsEntry("articleType", "STUDY");
        Number articleId = (Number) created.getBody().get("id");

        Map<String, Object> publicBeforePublish = get("/api/articles?status=PUBLISHED&keyword=T16&page=1&size=10");
        assertThat(publicBeforePublish).containsEntry("total", 0);

        ResponseEntity<Map> published = restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/publish"),
            HttpMethod.PUT,
            adminEntity(Map.of()),
            Map.class
        );
        assertThat(published.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(published.getBody()).containsEntry("status", "PUBLISHED");
        assertThat(published.getBody()).containsKey("publishedAt");

        Map<String, Object> publicAfterPublish = get("/api/articles?status=PUBLISHED&keyword=T16&page=1&size=10");
        assertThat(publicAfterPublish).containsEntry("total", 1);
        assertThat(publicAfterPublish.get("items").toString()).contains("T16 Study Article", "T16 Article Node");

        Map<String, Object> detail = get("/api/articles/" + articleId.longValue());
        assertThat(detail).containsEntry("title", "T16 Study Article");
        Integer viewLogs = jdbcTemplate.queryForObject(
            "select count(*) from user_behavior_logs where behavior_type = 'VIEW_ARTICLE' and target_type = 'ARTICLE' and target_id = ?",
            Integer.class,
            articleId.longValue()
        );
        assertThat(viewLogs).isGreaterThanOrEqualTo(1);

        Integer operationLogs = jdbcTemplate.queryForObject(
            "select count(*) from operation_logs where operation in ('ARTICLE_CREATE', 'ARTICLE_PUBLISH') and resource_type = 'ARTICLE' and resource_id = ?",
            Integer.class,
            articleId.longValue()
        );
        assertThat(operationLogs).isGreaterThanOrEqualTo(2);
    }

    @Test
    void articlesSupportNodeLinksWithoutArticleGraphNodes() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t16_linked_node", projectTypeId, "T16 Linked Graph Node");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/articles"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T16 Node Link Article",
                "content", "T16 node link content",
                "articleType", "NEWS",
                "status", "DRAFT"
            )),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        Number articleId = (Number) created.getBody().get("id");

        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/nodes"),
            HttpMethod.POST,
            adminEntity(Map.of("nodeId", nodeId)),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(linked.getBody().get("linkedNodes").toString()).contains("T16 Linked Graph Node");
        Integer articleGraphNodeCount = jdbcTemplate.queryForObject(
            "select count(*) from graph_nodes where node_code = ? and deleted = 0",
            Integer.class,
            "article_" + articleId.longValue()
        );
        assertThat(articleGraphNodeCount).isZero();

        restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/nodes/" + nodeId),
            HttpMethod.DELETE,
            adminEntity(Map.of()),
            Void.class
        );
        Integer remainingLinks = jdbcTemplate.queryForObject(
            "select count(*) from article_nodes where article_id = ? and node_id = ?",
            Integer.class,
            articleId.longValue(),
            nodeId
        );
        assertThat(remainingLinks).isZero();
    }

    @Test
    void articlesSupportProductLinks() {
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/articles"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T16 Product Link Article",
                "content", "T16 product link content",
                "articleType", "NEWS",
                "status", "DRAFT"
            )),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        Number articleId = (Number) created.getBody().get("id");

        jdbcTemplate.update("""
            insert into creative_products (product_code, name, description, price, stock, status)
            values ('test_t16_linked_product', 'T16 Linked Product', 'T16 purchasable product', 68.00, 12, 'APPROVED')
            """);
        long productId = jdbcTemplate.queryForObject(
            "select id from creative_products where product_code = 'test_t16_linked_product'",
            Long.class
        );

        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/products"),
            HttpMethod.POST,
            adminEntity(Map.of("productId", productId)),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(linked.getBody().get("linkedProducts").toString()).contains("T16 Linked Product");

        ResponseEntity<Map> duplicate = restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/products"),
            HttpMethod.POST,
            adminEntity(Map.of("productId", productId)),
            Map.class
        );
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        restTemplate.exchange(
            url("/api/articles/" + articleId.longValue() + "/products/" + productId),
            HttpMethod.DELETE,
            adminEntity(Map.of()),
            Void.class
        );
        Map<String, Object> detail = getAsAdmin("/api/articles/" + articleId.longValue() + "?backstage=true");
        assertThat(detail.get("linkedProducts").toString()).doesNotContain("T16 Linked Product");
    }

    @Test
    void exhibitionsSupportNodeLinksAndDisplayedAtGraphEdges() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long displayedAtTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'displayed_at'", Long.class);
        long nodeId = insertTestNode("test_t17_exhibition_node", projectTypeId, "T17 非遗展览节点");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/exhibitions"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T17 江南非遗市集",
                "description", "T17 面向公众开放的非遗展览市集",
                "province", "江苏省",
                "city", "苏州市",
                "address", "平江路",
                "organizer", "T17 非遗中心",
                "status", "PUBLISHED"
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        Number exhibitionId = (Number) created.getBody().get("id");

        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/exhibitions/" + exhibitionId.longValue() + "/nodes"),
            HttpMethod.POST,
            adminEntity(Map.of("nodeId", nodeId, "boothNo", "A12")),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(linked.getBody().get("linkedNodes").toString()).contains("T17 非遗展览节点", "A12");

        Number exhibitionGraphNodeId = jdbcTemplate.queryForObject(
            "select id from graph_nodes where node_code = ? and deleted = 0",
            Number.class,
            "exhibition_" + exhibitionId.longValue()
        );

        Integer graphEdgeCount = jdbcTemplate.queryForObject("""
            select count(*)
            from graph_edges
            where source_node_id = ? and target_node_id = ? and edge_type_id = ? and deleted = 0
            """, Integer.class, nodeId, exhibitionGraphNodeId.longValue(), displayedAtTypeId);
        assertThat(graphEdgeCount).isEqualTo(1);

        Map<String, Object> list = get("/api/exhibitions?status=PUBLISHED&keyword=T17&page=1&size=10");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("T17 江南非遗市集", "苏州市");

        Map<String, Object> detail = get("/api/exhibitions/" + exhibitionId.longValue());
        assertThat(detail.get("linkedNodes").toString()).contains("T17 非遗展览节点");

        restTemplate.exchange(
            url("/api/exhibitions/" + exhibitionId.longValue() + "/nodes/" + nodeId),
            HttpMethod.DELETE,
            adminEntity(Map.of()),
            Void.class
        );
        Integer remainingLinks = jdbcTemplate.queryForObject(
            "select count(*) from exhibition_nodes where exhibition_id = ? and node_id = ?",
            Integer.class,
            exhibitionId.longValue(),
            nodeId
        );
        assertThat(remainingLinks).isEqualTo(0);
    }

    @Test
    void exhibitionsSupportProductLinks() {
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/exhibitions"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T17 Product Link Exhibition",
                "description", "T17 product link exhibition",
                "organizer", "T17 Heritage Center",
                "status", "PUBLISHED"
            )),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        Number exhibitionId = (Number) created.getBody().get("id");

        jdbcTemplate.update("""
            insert into creative_products (product_code, name, description, price, stock, status)
            values ('test_t17_linked_product', 'T17 Linked Product', 'T17 purchasable product', 88.00, 8, 'APPROVED')
            """);
        long productId = jdbcTemplate.queryForObject(
            "select id from creative_products where product_code = 'test_t17_linked_product'",
            Long.class
        );

        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/exhibitions/" + exhibitionId.longValue() + "/products"),
            HttpMethod.POST,
            adminEntity(Map.of("productId", productId)),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(linked.getBody().get("linkedProducts").toString()).contains("T17 Linked Product");

        ResponseEntity<Map> duplicate = restTemplate.exchange(
            url("/api/exhibitions/" + exhibitionId.longValue() + "/products"),
            HttpMethod.POST,
            adminEntity(Map.of("productId", productId)),
            Map.class
        );
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        restTemplate.exchange(
            url("/api/exhibitions/" + exhibitionId.longValue() + "/products/" + productId),
            HttpMethod.DELETE,
            adminEntity(Map.of()),
            Void.class
        );
        Map<String, Object> detail = get("/api/exhibitions/" + exhibitionId.longValue());
        assertThat(detail.get("linkedProducts").toString()).doesNotContain("T17 Linked Product");
    }

    @Test
    void analyticsExposeSearchBehaviorAndOperationAudit() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        insertTestNode("test_t18_search_node", projectTypeId, "T18 Searchable Project");

        Map<String, Object> search = get("/api/graph/search?keyword=T18&page=1&size=10");
        assertThat(search.get("items").toString()).contains("T18 Searchable Project");

        jdbcTemplate.update("""
            insert into user_behavior_logs (behavior_type, target_type, target_id, extra_data)
            values ('T18_VIEW_NODE', 'NODE', 1, json_object('source', 'test'))
            """);
        jdbcTemplate.update("""
            insert into operation_logs (operation, resource_type, resource_id, request_method, request_uri)
            values ('T18_MANUAL_AUDIT', 'NODE', 1, 'PUT', '/api/test')
            """);

        Map<String, Object> hot = getAsAdmin("/api/analytics/search-hot?limit=50");
        assertThat(hot.get("items").toString()).contains("T18");

        Map<String, Object> behavior = getAsAdmin("/api/analytics/behavior-trend?days=7");
        assertThat(behavior.get("items").toString()).contains("T18_VIEW_NODE");

        Map<String, Object> operations = getAsAdmin("/api/analytics/operation-audit?page=1&size=10&keyword=T18");
        assertThat(operations).containsEntry("total", 1);
        assertThat(operations.get("items").toString()).contains("T18_MANUAL_AUDIT", "/api/test");
    }

    @Test
    void adminCanManageSensitiveWordsAndReviewLogs() {
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/content-governance/sensitive-words"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "word", "test_t20_blocked",
                "wordType", "COMMUNITY",
                "severity", 2,
                "status", 1
            )),
            Map.class
        );

        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(created.getBody()).containsEntry("word", "test_t20_blocked");
        assertThat(created.getBody()).containsEntry("wordType", "COMMUNITY");

        Map<String, Object> words = getAsAdmin("/api/content-governance/sensitive-words?keyword=test_t20&page=1&size=10");
        assertThat(words).containsEntry("total", 1);
        assertThat(words.get("items").toString()).contains("test_t20_blocked", "COMMUNITY");

        ResponseEntity<Map> blockedQuestion = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            bearerEntity(loginToken("test_admin_access"), Map.of(
                "title", "T20 blocked question",
                "content", "this contains test_t20_blocked"
            )),
            Map.class
        );
        assertThat(blockedQuestion.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        Map<String, Object> reviewRecords = getAsAdmin("/api/content-governance/review-records?keyword=test_t20&page=1&size=10");
        assertThat(reviewRecords).containsEntry("total", 1);
        assertThat(reviewRecords.get("items").toString()).contains("QUESTION", "test_t20_blocked", "BLOCKED");

        Map<String, Object> operations = getAsAdmin("/api/content-governance/operation-logs?keyword=SENSITIVE_WORD&page=1&size=10");
        assertThat(operations.get("items").toString()).contains("SENSITIVE_WORD_CREATE", "test_t20_blocked");
    }

    @Test
    void adminCanListUsersAndResetPasswordsForAllAccounts() {
        long targetUserId = insertTestUser("test_user_admin_mgmt", "T21 Managed User", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, targetUserId);

        Map<String, Object> list = getAsAdmin("/api/admin/users?page=1&size=20&keyword=test_user_admin_mgmt");
        assertThat(list).containsEntry("total", 1);
        assertThat(list.get("items").toString()).contains("test_user_admin_mgmt", "T21 Managed User");

        ResponseEntity<Map> reset = restTemplate.exchange(
            url("/api/admin/users/" + targetUserId + "/password"),
            HttpMethod.PUT,
            adminEntity(Map.of("newPassword", "reset1234")),
            Map.class
        );

        assertThat(reset.getStatusCode().is2xxSuccessful()).isTrue();
        String passwordHash = jdbcTemplate.queryForObject(
            "select password_hash from sys_users where id = ?",
            String.class,
            targetUserId
        );
        assertThat(passwordHash).isEqualTo("{noop}reset1234");
    }

    @Test
    void communityPostsCanBeDeletedByOwnerOrAdmin() {
        long normalId = insertTestUser("test_comm_owner", "T21 Community Owner", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, normalId);
        String normalToken = loginToken("test_comm_owner");

        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            bearerEntity(normalToken, Map.of(
                "title", "T21 owner delete question",
                "content", "question body"
            )),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        Number questionId = (Number) created.getBody().get("id");

        restTemplate.exchange(
            url("/api/community/questions/" + questionId.longValue()),
            HttpMethod.DELETE,
            bearerEntity(normalToken, Map.of()),
            Void.class
        );
        Integer deletedByOwner = jdbcTemplate.queryForObject(
            "select count(*) from community_questions where id = ? and deleted = 1",
            Integer.class,
            questionId.longValue()
        );
        assertThat(deletedByOwner).isEqualTo(1);

        long otherId = insertTestUser("test_comm_other", "T21 Community Other", "NORMAL");
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'NORMAL_USER'
            on duplicate key update user_id = values(user_id)
            """, otherId);
        String otherToken = loginToken("test_comm_other");

        ResponseEntity<Map> adminCreated = restTemplate.exchange(
            url("/api/community/questions"),
            HttpMethod.POST,
            adminEntity(Map.of(
                "title", "T21 admin delete question",
                "content", "admin body"
            )),
            Map.class
        );
        assertThat(adminCreated.getStatusCode().is2xxSuccessful()).isTrue();
        Number adminQuestionId = (Number) adminCreated.getBody().get("id");

        ResponseEntity<Void> forbiddenDelete = restTemplate.exchange(
            url("/api/community/questions/" + adminQuestionId.longValue()),
            HttpMethod.DELETE,
            adminEmptyEntityForToken(otherToken),
            Void.class
        );
        assertThat(forbiddenDelete.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        restTemplate.exchange(
            url("/api/community/questions/" + adminQuestionId.longValue()),
            HttpMethod.DELETE,
            adminEntity(Map.of()),
            Void.class
        );
        Integer deletedByAdmin = jdbcTemplate.queryForObject(
            "select count(*) from community_questions where id = ? and deleted = 1",
            Integer.class,
            adminQuestionId.longValue()
        );
        assertThat(deletedByAdmin).isEqualTo(1);
    }

    @Test
    void riskReportsRequireResolvePayloadAndPersistDecision() {
        long reportId = ensureTestRiskReport();

        ResponseEntity<Map> resolved = restTemplate.exchange(
            url("/api/risk/reports/" + reportId + "/resolve"),
            HttpMethod.PUT,
            adminEntity(Map.of(
                "decision", "IGNORED",
                "comment", "checked manually"
            )),
            Map.class
        );

        assertThat(resolved.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resolved.getBody()).containsEntry("status", "IGNORED");
        assertThat(resolved.getBody()).containsEntry("resolverNote", "checked manually");
    }

    @Test
    void enhancedRiskScanDetectsInheritanceConflictsDuplicatesAndAgingWithoutSuccessor() {
        long inheritorTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'inheritor'", Long.class);
        long inheritedFromTypeId = jdbcTemplate.queryForObject("select id from graph_edge_types where type_code = 'inherited_from'", Long.class);

        long apprentice = insertTestNode("test_t19_apprentice", inheritorTypeId, "T19 Apprentice");
        long masterA = insertTestNode("test_t19_master_a", inheritorTypeId, "T19 Master A");
        long masterB = insertTestNode("test_t19_master_b", inheritorTypeId, "T19 Master B");
        long senior = insertTestNode("test_t19_senior", inheritorTypeId, "T19 Senior No Successor");
        jdbcTemplate.update("update graph_nodes set extra_attrs = json_object('birthYear', 1950) where id = ?", senior);
        insertTestEdge(apprentice, masterA, inheritedFromTypeId, "T19 apprentice inherits master A");
        insertTestEdge(apprentice, masterB, inheritedFromTypeId, "T19 apprentice inherits master B");

        ResponseEntity<Map> scanned = restTemplate.exchange(
            url("/api/risk/scan"),
            HttpMethod.POST,
            adminEntity(Map.of()),
            Map.class
        );
        assertThat(scanned.getStatusCode().is2xxSuccessful()).isTrue();

        Map<String, Object> reports = getAsAdmin("/api/risk/reports?keyword=T19&page=1&size=20");
        assertThat(reports.get("items").toString()).contains(
            "CONFLICTING_INHERITANCE_EDGE",
            "DUPLICATED_INHERITANCE_CHAIN",
            "AGING_INHERITOR_NO_SUCCESSOR"
        );

        Number totalAfterFirstScan = (Number) reports.get("total");
        restTemplate.exchange(url("/api/risk/scan"), HttpMethod.POST, adminEntity(Map.of()), Map.class);
        Map<String, Object> afterSecondScan = getAsAdmin("/api/risk/reports?keyword=T19&page=1&size=20");
        assertThat(((Number) afterSecondScan.get("total")).intValue()).isEqualTo(totalAfterFirstScan.intValue());
    }

    private long insertTestNode(String code, long typeId, String name) {
        jdbcTemplate.update("""
            insert into graph_nodes (node_code, node_type_id, name, audit_status)
            values (?, ?, ?, 'APPROVED')
            """, code, typeId, name);
        return jdbcTemplate.queryForObject("select id from graph_nodes where node_code = ?", Long.class, code);
    }

    private void ensureTestNodeType(String typeCode, String typeName) {
        jdbcTemplate.update("""
            insert into graph_node_types (type_code, type_name, description, icon, color, sort_order, status, deleted)
            values (?, ?, ?, 'Circle', '#667085', 900, 1, 0)
            on duplicate key update
              type_name = values(type_name),
              status = 1,
              deleted = 0
            """, typeCode, typeName, "Test node type for API coverage");
    }

    private long insertTestEdge(long sourceId, long targetId, long edgeTypeId, String relationLabel) {
        jdbcTemplate.update("""
            insert into graph_edges (source_node_id, target_node_id, edge_type_id, directed, relation_label, audit_status)
            values (?, ?, ?, 1, ?, 'APPROVED')
            """, sourceId, targetId, edgeTypeId, relationLabel);
        return jdbcTemplate.queryForObject("""
            select id from graph_edges
            where source_node_id = ? and target_node_id = ? and edge_type_id = ? and deleted = 0
            """, Long.class, sourceId, targetId, edgeTypeId);
    }

    private void ensureTestEdgeType(String typeCode, String typeName, String inverseName) {
        jdbcTemplate.update("""
            insert into graph_edge_types (type_code, type_name, inverse_name, directed, description, status, deleted)
            values (?, ?, ?, 1, ?, 1, 0)
            on duplicate key update
              type_name = values(type_name),
              inverse_name = values(inverse_name),
              status = 1,
              deleted = 0
            """, typeCode, typeName, inverseName, "Test relation type for API coverage");
    }

    private long insertTestUser(String username, String nickname, String userType) {
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values (?, '{noop}test', ?, ?)
            """, username, nickname, userType);
        return jdbcTemplate.queryForObject("select id from sys_users where username = ?", Long.class, username);
    }

    private long ensureTestUserWithRole(String username, String nickname, String userType, String roleCode) {
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values (?, '{noop}test', ?, ?)
            on duplicate key update
              password_hash = values(password_hash),
              nickname = values(nickname),
              user_type = values(user_type),
              status = 1,
              deleted = 0
            """, username, nickname, userType);
        long userId = jdbcTemplate.queryForObject("select id from sys_users where username = ?", Long.class, username);
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = ?
            on duplicate key update user_id = values(user_id)
            """, userId, roleCode);
        return userId;
    }

    private String adminToken() {
        ensureTestUserWithRole("test_admin_access", "Test Admin Access", "SUPER_ADMIN", "SUPER_ADMIN");
        return loginToken("test_admin_access");
    }

    private String loginToken(String username) {
        ResponseEntity<Map> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            loginRequest(username, "test"),
            Map.class
        );
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        return login.getBody().get("token").toString();
    }

    private Map<?, ?> currentUserPayload(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> response = restTemplate.exchange(
            url("/api/auth/me"),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        return response.getBody();
    }

    private Map<String, Object> loginRequest(String username, String password) {
        Map<String, Object> captcha = captchaRequest();
        return Map.of(
            "username", username,
            "password", password,
            "captchaId", captcha.get("captchaId"),
            "captchaCode", captcha.get("captchaCode")
        );
    }

    private Map<String, Object> verifiedRegisterRequest(String username, String password, String nickname, String email) {
        Map<String, Object> emailCode = emailCodeRequest(email, "REGISTER");
        return Map.of(
            "username", username,
            "password", password,
            "nickname", nickname,
            "userType", "NORMAL",
            "email", email,
            "emailCode", emailCode.get("emailCode")
        );
    }

    private Map<String, Object> emailCodeRequest(String email, String purpose) {
        Map<String, Object> captcha = captchaRequest();
        ResponseEntity<Map> response = restTemplate.postForEntity(
            url("/api/auth/email-code"),
            Map.of(
                "email", email,
                "purpose", purpose,
                "captchaId", captcha.get("captchaId"),
                "captchaCode", captcha.get("captchaCode")
            ),
            Map.class
        );
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        return Map.of(
            "email", email,
            "emailCode", response.getBody().get("debugCode")
        );
    }

    private Map<String, Object> captchaRequest() {
        ResponseEntity<Map> response = restTemplate.getForEntity(url("/api/auth/captcha"), Map.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        return Map.of(
            "captchaId", response.getBody().get("captchaId"),
            "captchaCode", response.getBody().get("debugCode")
        );
    }

    private HttpEntity<Map<String, Object>> bearerEntity(String token, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }

    private HttpEntity<Map<String, Object>> adminEntity(Map<String, Object> body) {
        return bearerEntity(adminToken(), body);
    }

    private HttpEntity<Void> adminEmptyEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken());
        return new HttpEntity<>(headers);
    }

    private HttpEntity<Void> adminEmptyEntityForToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    private long ensureTestRiskReport() {
        long projectTypeId = jdbcTemplate.queryForObject("select id from graph_node_types where type_code = 'heritage_project'", Long.class);
        long nodeId = insertTestNode("test_t21_risk_node", projectTypeId, "T21 Risk Node");
        long ruleId = jdbcTemplate.queryForObject("select id from risk_rules where rule_code = 'NO_INHERITOR_FOR_PROJECT'", Long.class);
        jdbcTemplate.update("""
            delete from risk_reports
            where node_id = ? and rule_id = ? and status in ('OPEN', 'IGNORED', 'RESOLVED')
            """, nodeId, ruleId);
        jdbcTemplate.update("""
            insert into risk_reports (rule_id, node_id, title, description, severity, status)
            values (?, ?, ?, ?, 'HIGH', 'OPEN')
            """, ruleId, nodeId, "T21 Risk Report", "Initial risk report for admin resolve testing");
        return jdbcTemplate.queryForObject(
            "select id from risk_reports where node_id = ? and rule_id = ? order by id desc limit 1",
            Long.class,
            nodeId,
            ruleId
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> get(String path) {
        return restTemplate.getForObject(url(path), Map.class);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAsAdmin(String path) {
        ResponseEntity<Map> response = restTemplate.exchange(
            url(path),
            HttpMethod.GET,
            adminEmptyEntity(),
            Map.class
        );
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        return response.getBody();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
