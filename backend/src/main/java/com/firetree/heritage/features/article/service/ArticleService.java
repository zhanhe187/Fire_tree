package com.firetree.heritage.features.article.service;

import com.firetree.heritage.features.article.dto.ArticleNodeRequest;
import com.firetree.heritage.features.article.dto.ArticleRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.article.mapper.ArticleMapper;
import com.firetree.heritage.features.system.service.AccessControlService;
import org.springframework.stereotype.Service;

@Service
public class ArticleService {

    private final ArticleMapper mapper;

    public ArticleService(ArticleMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchArticles(String keyword, String articleType, String status, int page, int size, AccessControlService.AuthContext context) {
        return mapper.searchArticles(keyword, articleType, status, page, size, context);
    }

    public Map<String, Object> getArticle(long id, AccessControlService.AuthContext context) {
        return mapper.getArticle(id, context);
    }

    public Map<String, Object> createArticle(ArticleRequest request, long authorId) {
        return mapper.createArticle(request, authorId);
    }

    public Map<String, Object> updateArticle(long id, ArticleRequest request, AccessControlService.AuthContext context) {
        return mapper.updateArticle(id, request, context);
    }

    public void deleteArticle(long id, AccessControlService.AuthContext context) {
        mapper.deleteArticle(id, context);
    }

    public Map<String, Object> publishArticle(long id, AccessControlService.AuthContext context) {
        return mapper.publishArticle(id, context);
    }

    public Map<String, Object> offlineArticle(long id, AccessControlService.AuthContext context) {
        return mapper.offlineArticle(id, context);
    }

    public Map<String, Object> linkNode(long articleId, ArticleNodeRequest request, AccessControlService.AuthContext context) {
        return mapper.linkNode(articleId, request, context);
    }

    public void unlinkNode(long articleId, long nodeId, AccessControlService.AuthContext context) {
        mapper.unlinkNode(articleId, nodeId, context);
    }

    public Map<String, Object> linkProduct(long articleId, ProductLinkRequest request, AccessControlService.AuthContext context) {
        return mapper.linkProduct(articleId, request, context);
    }

    public void unlinkProduct(long articleId, long productId, AccessControlService.AuthContext context) {
        mapper.unlinkProduct(articleId, productId, context);
    }
}
