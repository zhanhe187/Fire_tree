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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 资料补全（/material-submit）相关的封面提升与审核可见性契约。
 *
 * 背景：上传的新图固定以 sort_order=0 挂接，而封面选取是 order by sort_order, id 取第一条，
 * 因此新图永远排在既有 -100 图片之后；普通用户上传的图是 PRIVATE，审核只改 audit_status 时
 * 依然不会公开。这里把三条行为固化为测试。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class MaterialSubmissionApiTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    @AfterEach
    void cleanupMaterialTestData() {
        jdbcTemplate.update("""
            delete from media_files
            where id in (
                select nm.file_id
                from graph_node_media nm
                join graph_nodes n on n.id = nm.node_id
                where n.node_code like 'test_mat_%'
            )
            """);
        jdbcTemplate.update("""
            delete from graph_node_media
            where node_id in (select id from graph_nodes where node_code like 'test_mat_%')
            """);
        jdbcTemplate.update("delete from media_files where object_key like 'test_mat/%'");
        jdbcTemplate.update("delete from graph_nodes where node_code like 'test_mat_%'");
        jdbcTemplate.update("delete from sys_users where username like 'test_mat_%'");
    }

    @Test
    void adminSubmissionBecomesNodeCoverInsteadOfStayingBehindTheOldImage() {
        long nodeId = insertNode("test_mat_admin_node", "T30 管理员资料补全节点");
        long oldFileId = createMediaFile("test_mat/t30-old-cover.jpg", "https://example.test/t30-old-cover.jpg");
        link(oldFileId, nodeId, "旧封面说明", -100);
        assertThat(coverUrl(nodeId)).isEqualTo("https://example.test/t30-old-cover.jpg");

        Map<String, Object> submission = submitAsAdmin(nodeId, "T30 新上传封面", "t30-new-cover.jpg");
        assertThat(submission).containsEntry("directApproved", true);
        assertThat(submission).containsEntry("auditStatus", "APPROVED");

        Number newFileId = (Number) ((Map<?, ?>) submission.get("media")).get("id");
        Integer newSortOrder = jdbcTemplate.queryForObject(
            "select sort_order from graph_node_media where node_id = ? and file_id = ?",
            Integer.class,
            nodeId,
            newFileId.longValue()
        );
        assertThat(newSortOrder)
            .as("新上传的图片必须排在既有 -100 封面之前，否则封面永远不更新")
            .isLessThan(-100);

        assertThat(coverUrl(nodeId))
            .as("管理员直接提交的图片应当立即成为节点封面")
            .isEqualTo(previewUrlOf(newFileId.longValue()));
        assertThat(coverCaption(nodeId)).isEqualTo("T30 新上传封面");
    }

    @Test
    void userSubmissionBecomesCoverOnlyAfterApproval() {
        insertUser("test_mat_user", "T30 资料提交用户", "NORMAL_USER");
        String userToken = loginToken("test_mat_user");

        long nodeId = insertNode("test_mat_user_node", "T30 用户资料补全节点");
        long oldFileId = createMediaFile("test_mat/t30-user-old.jpg", "https://example.test/t30-user-old.jpg");
        link(oldFileId, nodeId, "旧封面说明", -100);

        Map<String, Object> submission = submitAs(userToken, nodeId, "T30 用户上传封面", "t30-user-new.jpg");
        assertThat(submission).containsEntry("directApproved", false);
        assertThat(submission).containsEntry("auditStatus", "PENDING");
        assertThat(submission).containsEntry("visibility", "PRIVATE");
        Number newFileId = (Number) ((Map<?, ?>) submission.get("media")).get("id");

        assertThat(coverUrl(nodeId))
            .as("未审核通过的用户上传不得直接替换公开封面")
            .isEqualTo("https://example.test/t30-user-old.jpg");

        ResponseEntity<Map> audited = restTemplate.exchange(
            url("/api/media/files/" + newFileId.longValue() + "/audit"),
            HttpMethod.PUT,
            adminEntity(Map.of("action", "APPROVE")),
            Map.class
        );
        assertThat(audited.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(audited.getBody()).containsEntry("visibility", "PUBLIC");
        assertThat(audited.getBody()).containsEntry("auditStatus", "APPROVED");

        assertThat(coverUrl(nodeId))
            .as("审核通过后用户上传的图片应当成为节点封面")
            .isEqualTo(previewUrlOf(newFileId.longValue()));
        assertThat(coverCaption(nodeId)).isEqualTo("T30 用户上传封面");
    }

    @Test
    void rejectedSubmissionStaysPrivateAndNeverBecomesCover() {
        insertUser("test_mat_reject_user", "T30 被驳回用户", "NORMAL_USER");
        String userToken = loginToken("test_mat_reject_user");

        long nodeId = insertNode("test_mat_reject_node", "T30 驳回节点");
        long oldFileId = createMediaFile("test_mat/t30-reject-old.jpg", "https://example.test/t30-reject-old.jpg");
        link(oldFileId, nodeId, "旧封面说明", -100);

        Map<String, Object> submission = submitAs(userToken, nodeId, "T30 将被驳回", "t30-reject.jpg");
        Number newFileId = (Number) ((Map<?, ?>) submission.get("media")).get("id");

        ResponseEntity<Map> audited = restTemplate.exchange(
            url("/api/media/files/" + newFileId.longValue() + "/audit"),
            HttpMethod.PUT,
            adminEntity(Map.of("action", "REJECT")),
            Map.class
        );
        assertThat(audited.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(audited.getBody()).containsEntry("visibility", "PRIVATE");
        assertThat(audited.getBody()).containsEntry("auditStatus", "REJECTED");

        assertThat(coverUrl(nodeId)).isEqualTo("https://example.test/t30-reject-old.jpg");
        Map<String, Object> publicMedia = restTemplate.getForObject(
            url("/api/graph/nodes/" + nodeId + "/media"),
            Map.class
        );
        assertThat(publicMedia).isNotNull();
        assertThat(((Number) publicMedia.get("total")).intValue())
            .as("被驳回的图片不得出现在公开图库中")
            .isEqualTo(1);
    }

    @Test
    void coverCaptionCanBeCompletedWithoutUploadingAnotherImage() {
        long nodeId = insertNode("test_mat_caption_node", "T30 只补说明节点");
        long fileId = createMediaFile("test_mat/t30-caption.jpg", "https://example.test/t30-caption.jpg");
        link(fileId, nodeId, null, -100);
        assertThat(coverUrl(nodeId)).isEqualTo("https://example.test/t30-caption.jpg");
        assertThat(coverCaption(nodeId)).isNull();

        ResponseEntity<Map> updated = restTemplate.exchange(
            url("/api/media/nodes/" + nodeId + "/cover-caption"),
            HttpMethod.PUT,
            adminEntity(Map.of("caption", "T30 补写的图像说明")),
            Map.class
        );
        assertThat(updated.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(coverCaption(nodeId))
            .as("已有关联图片的节点必须能在不换图的前提下补上图像说明")
            .isEqualTo("T30 补写的图像说明");
    }

    // ---------- helpers ----------

    private long insertNode(String code, String name) {
        long projectTypeId = jdbcTemplate.queryForObject(
            "select id from graph_node_types where type_code = 'heritage_project'",
            Long.class
        );
        jdbcTemplate.update("""
            insert into graph_nodes (node_code, node_type_id, name, audit_status)
            values (?, ?, ?, 'APPROVED')
            """, code, projectTypeId, name);
        return jdbcTemplate.queryForObject("select id from graph_nodes where node_code = ?", Long.class, code);
    }

    private void insertUser(String username, String nickname, String userType) {
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values (?, '{noop}test', ?, ?)
            """, username, nickname, userType);
    }

    private long createMediaFile(String objectKey, String previewUrl) {
        Map<String, Object> request = Map.of(
            "bucketName", "heritage-test",
            "objectKey", objectKey,
            "originalName", objectKey.substring(objectKey.lastIndexOf('/') + 1),
            "fileType", "IMAGE",
            "contentType", "image/jpeg",
            "fileSize", 1024,
            "checksum", "sha256-" + objectKey,
            "previewUrl", previewUrl,
            "visibility", "PUBLIC",
            "auditStatus", "APPROVED"
        );
        ResponseEntity<Map> created = restTemplate.exchange(
            url("/api/media/files"),
            HttpMethod.POST,
            adminEntity(request),
            Map.class
        );
        assertThat(created.getStatusCode().is2xxSuccessful()).isTrue();
        return ((Number) created.getBody().get("id")).longValue();
    }

    private void link(long fileId, long nodeId, String caption, int sortOrder) {
        Map<String, Object> request = new java.util.HashMap<>();
        request.put("nodeId", nodeId);
        request.put("sortOrder", sortOrder);
        if (caption != null) {
            request.put("caption", caption);
        }
        ResponseEntity<Map> linked = restTemplate.exchange(
            url("/api/media/files/" + fileId + "/links"),
            HttpMethod.POST,
            adminEntity(request),
            Map.class
        );
        assertThat(linked.getStatusCode().is2xxSuccessful()).isTrue();
    }

    private Map<String, Object> submitAsAdmin(long nodeId, String caption, String fileName) {
        return submit(adminToken(), nodeId, caption, fileName);
    }

    private Map<String, Object> submitAs(String token, long nodeId, String caption, String fileName) {
        return submit(token, nodeId, caption, fileName);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> submit(String token, long nodeId, String caption, String fileName) {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            fileName,
            "image/jpeg",
            ("fake-image-" + fileName).getBytes()
        );
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("nodeId", String.valueOf(nodeId));
        body.add("caption", caption);
        body.add("file", file.getResource());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        ResponseEntity<Map> response = restTemplate.exchange(
            url("/api/media/submissions"),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        return response.getBody();
    }

    private String previewUrlOf(long fileId) {
        return jdbcTemplate.queryForObject("select preview_url from media_files where id = ?", String.class, fileId);
    }

    private String coverUrl(long nodeId) {
        Map<String, Object> node = restTemplate.getForObject(url("/api/graph/nodes/" + nodeId), Map.class);
        assertThat(node).isNotNull();
        Object cover = node.get("coverImageUrl");
        return cover == null ? null : cover.toString();
    }

    private String coverCaption(long nodeId) {
        Map<String, Object> node = restTemplate.getForObject(url("/api/graph/nodes/" + nodeId), Map.class);
        assertThat(node).isNotNull();
        Object caption = node.get("coverImageCaption");
        return caption == null ? null : caption.toString();
    }

    private String adminToken() {
        ensureAdminUser();
        return loginToken("test_mat_admin");
    }

    private void ensureAdminUser() {
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values ('test_mat_admin', '{noop}test', 'T30 Admin', 'SUPER_ADMIN')
            on duplicate key update
              password_hash = values(password_hash),
              nickname = values(nickname),
              user_type = values(user_type),
              status = 1,
              deleted = 0
            """);
        long userId = jdbcTemplate.queryForObject("select id from sys_users where username = 'test_mat_admin'", Long.class);
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = 'SUPER_ADMIN'
            on duplicate key update user_id = values(user_id)
            """, userId);
    }

    private String loginToken(String username) {
        ResponseEntity<Map> captcha = restTemplate.getForEntity(url("/api/auth/captcha"), Map.class);
        assertThat(captcha.getStatusCode().is2xxSuccessful()).isTrue();
        Map<?, ?> captchaBody = captcha.getBody();
        ResponseEntity<Map> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            Map.of(
                "username", username,
                "password", "test",
                "captchaId", captchaBody.get("captchaId"),
                "captchaCode", captchaBody.get("debugCode")
            ),
            Map.class
        );
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        return login.getBody().get("token").toString();
    }

    private HttpEntity<Map<String, Object>> adminEntity(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
