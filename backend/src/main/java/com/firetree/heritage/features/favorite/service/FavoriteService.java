package com.firetree.heritage.features.favorite.service;

import com.firetree.heritage.features.favorite.dto.FavoriteNodeRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.firetree.heritage.features.favorite.mapper.FavoriteMapper;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;
import org.springframework.stereotype.Service;

@Service
public class FavoriteService {

    private final FavoriteMapper mapper;
    private final UserLookupMapper userLookupMapper;

    public FavoriteService(FavoriteMapper mapper, UserLookupMapper userLookupMapper) {
        this.mapper = mapper;
        this.userLookupMapper = userLookupMapper;
    }

    public long resolveUserId(Long userId, String username) {
        return userLookupMapper.resolveUserId(userId, username, "username");
    }

    public Map<String, Object> favorites(long userId, String keyword, int page, int size) {
        return mapper.favorites(userId, keyword, page, size);
    }

    public Map<String, Object> favoriteNode(FavoriteNodeRequest request) {
        return mapper.favoriteNode(request);
    }

    public Map<String, Object> updateNote(long nodeId, FavoriteNodeRequest request) {
        return mapper.updateNote(nodeId, request);
    }

    public void unfavoriteNode(long userId, long nodeId) {
        mapper.unfavoriteNode(userId, nodeId);
    }

    public Map<String, Object> personalGraph(long userId) {
        return mapper.personalGraph(userId);
    }
}
