package com.firetree.heritage.features.article.dto;

import jakarta.validation.constraints.NotNull;

public record ArticleNodeRequest(
    @NotNull Long nodeId
) {
}
