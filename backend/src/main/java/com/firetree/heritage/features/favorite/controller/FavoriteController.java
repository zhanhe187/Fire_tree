package com.firetree.heritage.features.favorite.controller;

import com.firetree.heritage.features.favorite.dto.FavoriteNodeRequest;
import com.firetree.heritage.features.favorite.service.FavoriteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping("/nodes")
    public Map<String, Object> nodes(
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String username,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return favoriteService.favorites(favoriteService.resolveUserId(userId, username), keyword, page, size);
    }

    @PostMapping("/nodes")
    public Map<String, Object> favoriteNode(@Valid @RequestBody FavoriteNodeRequest request) {
        return favoriteService.favoriteNode(request);
    }

    @PutMapping("/nodes/{nodeId}")
    public Map<String, Object> updateNote(@PathVariable long nodeId, @Valid @RequestBody FavoriteNodeRequest request) {
        return favoriteService.updateNote(nodeId, request);
    }

    @DeleteMapping("/nodes/{nodeId}")
    public void unfavoriteNode(
        @PathVariable long nodeId,
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String username
    ) {
        favoriteService.unfavoriteNode(favoriteService.resolveUserId(userId, username), nodeId);
    }

    @GetMapping("/graph")
    public Map<String, Object> personalGraph(
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String username
    ) {
        return favoriteService.personalGraph(favoriteService.resolveUserId(userId, username));
    }
}
