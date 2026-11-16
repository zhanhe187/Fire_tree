package com.firetree.heritage.features.article.controller;

import com.firetree.heritage.features.article.dto.ArticleNodeRequest;
import com.firetree.heritage.features.article.dto.ArticleRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.article.service.ArticleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;
    private final AccessControlService accessControlService;

    public ArticleController(ArticleService articleService, AccessControlService accessControlService) {
        this.articleService = articleService;
        this.accessControlService = accessControlService;
    }

    @GetMapping
    public Map<String, Object> articles(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String articleType,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return articleService.searchArticles(keyword, articleType, status, page, size, context);
    }

    @GetMapping("/{id}")
    public Map<String, Object> article(
        @PathVariable long id,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return articleService.getArticle(id, context);
    }

    @PostMapping
    public Map<String, Object> createArticle(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ArticleRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.createArticle(request, context.userId());
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateArticle(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ArticleRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.updateArticle(id, request, context);
    }

    @DeleteMapping("/{id}")
    public void deleteArticle(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        articleService.deleteArticle(id, context);
    }

    @PutMapping("/{id}/publish")
    public Map<String, Object> publishArticle(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.publishArticle(id, context);
    }

    @PutMapping("/{id}/offline")
    public Map<String, Object> offlineArticle(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.offlineArticle(id, context);
    }

    @PostMapping("/{id}/nodes")
    public Map<String, Object> linkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ArticleNodeRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.linkNode(id, request, context);
    }

    @DeleteMapping("/{id}/nodes/{nodeId}")
    public void unlinkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @PathVariable long nodeId
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        articleService.unlinkNode(id, nodeId, context);
    }

    @PostMapping("/{id}/products")
    public Map<String, Object> linkProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ProductLinkRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return articleService.linkProduct(id, request, context);
    }

    @DeleteMapping("/{id}/products/{productId}")
    public void unlinkProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @PathVariable long productId
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        articleService.unlinkProduct(id, productId, context);
    }
}
