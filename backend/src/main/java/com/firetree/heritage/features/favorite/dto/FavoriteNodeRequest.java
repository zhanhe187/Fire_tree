package com.firetree.heritage.features.favorite.dto;

public record FavoriteNodeRequest(
    Long userId,
    String username,
    Long nodeId,
    String note
) {
}
