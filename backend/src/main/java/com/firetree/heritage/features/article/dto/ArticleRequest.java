package com.firetree.heritage.features.article.dto;

import jakarta.validation.constraints.Size;

public record ArticleRequest(
    @Size(max = 255) String title,
    @Size(max = 1000) String summary,
    String content,
    Long coverFileId,
    Long relatedNodeId,
    String articleType,
    String status
) {
}
