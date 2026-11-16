package com.firetree.heritage.features.article.mapper;

import com.firetree.heritage.features.article.dto.ArticleNodeRequest;
import com.firetree.heritage.features.article.dto.ArticleRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
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
import com.firetree.heritage.features.system.service.AuditLogService;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class ArticleMapper {

    private static final List<String> VALID_TYPES = List.of("NEWS", "ACTIVITY", "STUDY");
    private static final List<String> VALID_STATUS = List.of("DRAFT", "PUBLISHED", "OFFLINE");
    private static final String LINKED_NODE_COVER_JOIN = """
        left join (
          select ranked.article_id, ranked.preview_url
          from (
            select
              an.article_id,
              f.preview_url,
              row_number() over (partition by an.article_id order by nm.sort_order, nm.id) as rn
            from article_nodes an
            join graph_node_media nm on nm.node_id = an.node_id
            join media_files f on f.id = nm.file_id
            where f.deleted = 0
              and f.file_type = 'IMAGE'
              and f.visibility = 'PUBLIC'
              and f.audit_status = 'APPROVED'
              and f.preview_url is not null
          ) ranked
          where ranked.rn = 1
        ) linked_cover on linked_cover.article_id = a.id
        """;
    private static final String RELATED_NODE_COVER_JOIN = """
        left join (
          select ranked.node_id, ranked.preview_url
          from (
            select
              nm.node_id,
              f.preview_url,
              row_number() over (partition by nm.node_id order by nm.sort_order, nm.id) as rn
            from graph_node_media nm
            join media_files f on f.id = nm.file_id
            where f.deleted = 0
              and f.file_type = 'IMAGE'
              and f.visibility = 'PUBLIC'
              and f.audit_status = 'APPROVED'
              and f.preview_url is not null
          ) ranked
          where ranked.rn = 1
        ) related_cover on related_cover.node_id = a.related_node_id
        """;

    private final MybatisSqlExecutor sqlExecutor;
    private final AuditLogService auditLogService;

    public ArticleMapper(MybatisSqlExecutor sqlExecutor, AuditLogService auditLogService) {
        this.sqlExecutor = sqlExecutor;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> searchArticles(String keyword, String articleType, String status, int page, int size, AccessControlService.AuthContext context) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, articleType, status, context, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from news_articles a
            left join graph_nodes n on n.id = a.related_node_id and n.deleted = 0
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              a.id,
              a.title,
              a.summary,
              a.content,
              a.cover_file_id as coverFileId,
              coalesce(mf.preview_url, linked_cover.preview_url, related_cover.preview_url) as coverUrl,
              linked_cover.preview_url as linkedNodeCoverUrl,
              a.related_node_id as relatedNodeId,
              n.node_code as relatedNodeCode,
              n.name as relatedNodeName,
              a.author_id as authorId,
              u.nickname as authorName,
              a.article_type as articleType,
              a.status,
              a.published_at as publishedAt,
              a.created_at as createdAt,
              a.updated_at as updatedAt,
              coalesce(node_count.linkedNodeCount, 0) as linkedNodeCount
            from news_articles a
            left join media_files mf on mf.id = a.cover_file_id and mf.deleted = 0
            %s
            %s
            left join graph_nodes n on n.id = a.related_node_id and n.deleted = 0
            left join sys_users u on u.id = a.author_id and u.deleted = 0
            left join (
              select article_id, count(*) as linkedNodeCount
              from article_nodes
              group by article_id
            ) node_count on node_count.article_id = a.id
            where %s
            order by coalesce(a.published_at, a.updated_at) desc, a.id desc
            limit ?, ?
            """.formatted(RELATED_NODE_COVER_JOIN, LINKED_NODE_COVER_JOIN, where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getArticle(long id, AccessControlService.AuthContext context) {
        ensureArticleOwned(id, context);
        Map<String, Object> article = articleById(id);
        if (context == null && !"PUBLISHED".equals(String.valueOf(article.get("status")))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found");
        }
        auditLogService.recordBehavior(null, "VIEW_ARTICLE", "ARTICLE", id, Map.of("title", article.get("title")));
        return article;
    }

    @Transactional
    public Map<String, Object> createArticle(ArticleRequest request, long authorId) {
        requireText(request.title(), "title is required");
        requireText(request.content(), "content is required");
        validateReferences(request.coverFileId(), request.relatedNodeId());

        String status = normalizeStatus(request.status());
        long id = sqlExecutor.insertAndReturnKey("""
            insert into news_articles (
              title, summary, content, cover_file_id, related_node_id, author_id, article_type, status, published_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, if(? = 'PUBLISHED', current_timestamp, null))
            """,
            request.title().trim(),
            blankToNull(request.summary()),
            request.content().trim(),
            request.coverFileId(),
            request.relatedNodeId(),
            authorId,
            normalizeType(request.articleType()),
            status,
            status
        );
        auditLogService.recordOperation(authorId, "ARTICLE_CREATE", "ARTICLE", id, "POST", "/api/articles", Map.of("title", request.title()));
        return articleById(id);
    }

    @Transactional
    public Map<String, Object> updateArticle(long id, ArticleRequest request, AccessControlService.AuthContext context) {
        ensureArticleOwned(id, context);
        validateReferences(request.coverFileId(), request.relatedNodeId());
        String normalizedStatus = request.status() == null || request.status().isBlank() ? null : normalizeStatus(request.status());
        sqlExecutor.update("""
            update news_articles
            set
              title = coalesce(?, title),
              summary = coalesce(?, summary),
              content = coalesce(?, content),
              cover_file_id = ?,
              related_node_id = ?,
              article_type = coalesce(?, article_type),
              status = coalesce(?, status),
              published_at = case
                when ? = 'PUBLISHED' and published_at is null then current_timestamp
                when ? <> 'PUBLISHED' then null
                else published_at
              end
            where id = ? and deleted = 0
            """,
            blankToNull(request.title()),
            blankToNull(request.summary()),
            blankToNull(request.content()),
            request.coverFileId(),
            request.relatedNodeId(),
            request.articleType() == null || request.articleType().isBlank() ? null : normalizeType(request.articleType()),
            normalizedStatus,
            normalizedStatus,
            normalizedStatus,
            id
        );
        auditLogService.recordOperation(context.userId(), "ARTICLE_UPDATE", "ARTICLE", id, "PUT", "/api/articles/" + id, Map.of());
        return articleById(id);
    }

    @Transactional
    public void deleteArticle(long id, AccessControlService.AuthContext context) {
        ensureArticleOwned(id, context);
        // Physical delete to prevent ghost rows
        sqlExecutor.update("delete from news_articles where id = ?", id);
        auditLogService.recordOperation(context.userId(), "ARTICLE_DELETE", "ARTICLE", id, "DELETE", "/api/articles/" + id, Map.of());
    }

    @Transactional
    public Map<String, Object> publishArticle(long id, AccessControlService.AuthContext context) {
        ensureArticleOwned(id, context);
        sqlExecutor.update("""
            update news_articles
            set status = 'PUBLISHED', published_at = coalesce(published_at, current_timestamp)
            where id = ? and deleted = 0
            """, id);
        auditLogService.recordOperation(context.userId(), "ARTICLE_PUBLISH", "ARTICLE", id, "PUT", "/api/articles/" + id + "/publish", Map.of());
        return articleById(id);
    }

    @Transactional
    public Map<String, Object> offlineArticle(long id, AccessControlService.AuthContext context) {
        ensureArticleOwned(id, context);
        sqlExecutor.update("update news_articles set status = 'OFFLINE', published_at = null where id = ? and deleted = 0", id);
        auditLogService.recordOperation(context.userId(), "ARTICLE_OFFLINE", "ARTICLE", id, "PUT", "/api/articles/" + id + "/offline", Map.of());
        return articleById(id);
    }

    private String buildWhere(String keyword, String articleType, String status, AccessControlService.AuthContext context, List<Object> params) {
        StringBuilder where = new StringBuilder("a.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (a.title like ? or a.summary like ? or a.content like ? or n.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (articleType != null && !articleType.isBlank()) {
            where.append(" and a.article_type = ?");
            params.add(normalizeType(articleType));
        }
        if (status != null && !status.isBlank()) {
            where.append(" and a.status = ?");
            params.add(normalizeStatus(status));
        }
        if (context != null && !context.isSuperAdmin()) {
            where.append(" and a.author_id = ?");
            params.add(context.userId());
        }
        return where.toString();
    }

    @Transactional
    public Map<String, Object> linkNode(long articleId, ArticleNodeRequest request, AccessControlService.AuthContext context) {
        ensureArticleOwned(articleId, context);
        if (request.nodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is required");
        }
        ensureGraphNodeExists(request.nodeId());
        try {
            sqlExecutor.update("insert into article_nodes (article_id, node_id) values (?, ?)", articleId, request.nodeId());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Node is already linked to this article");
        }
        auditLogService.recordOperation(context.userId(), "ARTICLE_LINK_NODE", "ARTICLE", articleId, "POST", "/api/articles/" + articleId + "/nodes", Map.of("nodeId", request.nodeId()));
        return getArticle(articleId, context);
    }

    @Transactional
    public void unlinkNode(long articleId, long nodeId, AccessControlService.AuthContext context) {
        ensureArticleOwned(articleId, context);
        sqlExecutor.update("delete from article_nodes where article_id = ? and node_id = ?", articleId, nodeId);
        auditLogService.recordOperation(context.userId(), "ARTICLE_UNLINK_NODE", "ARTICLE", articleId, "DELETE", "/api/articles/" + articleId + "/nodes/" + nodeId, Map.of("nodeId", nodeId));
    }

    @Transactional
    public Map<String, Object> linkProduct(long articleId, ProductLinkRequest request, AccessControlService.AuthContext context) {
        ensureArticleOwned(articleId, context);
        ensureProductExists(request.productId());
        try {
            sqlExecutor.update("insert into article_products (article_id, product_id) values (?, ?)", articleId, request.productId());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is already linked to this article");
        }
        auditLogService.recordOperation(context.userId(), "ARTICLE_LINK_PRODUCT", "ARTICLE", articleId, "POST", "/api/articles/" + articleId + "/products", Map.of("productId", request.productId()));
        return getArticle(articleId, context);
    }

    @Transactional
    public void unlinkProduct(long articleId, long productId, AccessControlService.AuthContext context) {
        ensureArticleOwned(articleId, context);
        sqlExecutor.update("delete from article_products where article_id = ? and product_id = ?", articleId, productId);
        auditLogService.recordOperation(context.userId(), "ARTICLE_UNLINK_PRODUCT", "ARTICLE", articleId, "DELETE", "/api/articles/" + articleId + "/products/" + productId, Map.of("productId", productId));
    }

    private void ensureGraphNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from graph_nodes where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Graph node not found");
        }
    }


    private Map<String, Object> articleById(long id) {
        try {
            Map<String, Object> article = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  a.id,
                  a.title,
                  a.summary,
                  a.content,
                  a.cover_file_id as coverFileId,
                  coalesce(mf.preview_url, linked_cover.preview_url, related_cover.preview_url) as coverUrl,
                  linked_cover.preview_url as linkedNodeCoverUrl,
                  a.related_node_id as relatedNodeId,
                  n.node_code as relatedNodeCode,
                  n.name as relatedNodeName,
                  a.author_id as authorId,
                  u.nickname as authorName,
                  a.article_type as articleType,
                  a.status,
                  a.published_at as publishedAt,
                  a.created_at as createdAt,
                  a.updated_at as updatedAt
                from news_articles a
                left join media_files mf on mf.id = a.cover_file_id and mf.deleted = 0
                %s
                %s
                left join graph_nodes n on n.id = a.related_node_id and n.deleted = 0
                left join sys_users u on u.id = a.author_id and u.deleted = 0
                where a.id = ? and a.deleted = 0
                """.formatted(RELATED_NODE_COVER_JOIN, LINKED_NODE_COVER_JOIN), id));
            article.put("linkedNodes", linkedNodes(id));
            article.put("linkedProducts", linkedProducts(id));
            return article;
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found");
        }
    }

    private List<Map<String, Object>> linkedNodes(long articleId) {
        return sqlExecutor.queryForList("""
            select
              an.id,
              an.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              an.created_at as createdAt
            from article_nodes an
            join graph_nodes n on n.id = an.node_id and n.deleted = 0
            join graph_node_types nt on nt.id = n.node_type_id
            where an.article_id = ?
            order by an.created_at desc, an.id desc
            """, articleId);
    }

    private List<Map<String, Object>> linkedProducts(long articleId) {
        return sqlExecutor.queryForList("""
            select
              ap.id,
              p.id as productId,
              p.product_code as productCode,
              p.name as productName,
              p.description,
              mf.preview_url as coverUrl,
              p.price,
              p.stock,
              p.status,
              ap.created_at as createdAt
            from article_products ap
            join creative_products p on p.id = ap.product_id and p.deleted = 0
            left join media_files mf on mf.id = p.cover_file_id and mf.deleted = 0
            where ap.article_id = ?
            order by ap.created_at desc, ap.id desc
            """, articleId);
    }

    private void validateReferences(Long coverFileId, Long relatedNodeId) {
        if (coverFileId != null) {
            ensureExists("media_files", coverFileId, "Media file not found");
        }
        if (relatedNodeId != null) {
            ensureExists("graph_nodes", relatedNodeId, "Graph node not found");
        }
    }

    private void ensureArticleExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from news_articles where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found");
        }
    }

    private void ensureArticleOwned(long id, AccessControlService.AuthContext context) {
        ensureArticleExists(id);
        if (context == null || context.isSuperAdmin()) {
            return;
        }
        Long authorId = sqlExecutor.queryForObject(
            "select author_id from news_articles where id = ? and deleted = 0",
            Long.class,
            id
        );
        if (authorId == null || authorId != context.userId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Article belongs to another user");
        }
    }

    private void ensureProductExists(long id) {
        Integer count = sqlExecutor.queryForObject("select count(*) from creative_products where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found");
        }
    }

    private void ensureExists(String table, long id, String message) {
        Integer count = sqlExecutor.queryForObject("select count(*) from " + table + " where id = ? and deleted = 0", Integer.class, id);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String normalizeType(String value) {
        String normalized = value == null || value.isBlank() ? "NEWS" : value.trim().toUpperCase();
        if (!VALID_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "articleType is invalid");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase();
        if (!VALID_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        }
        return normalized;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

}
