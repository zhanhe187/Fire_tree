package com.firetree.heritage.features.exhibition.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.exhibition.dto.ExhibitionNodeRequest;
import com.firetree.heritage.features.exhibition.dto.ExhibitionRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.firetree.heritage.features.exhibition.mapper.ExhibitionMapper;
import com.firetree.heritage.features.system.service.AccessControlService;
import org.springframework.stereotype.Service;

@Service
public class ExhibitionService {

    private final ExhibitionMapper mapper;

    public ExhibitionService(ExhibitionMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchExhibitions(String keyword, String province, String city, String status, int page, int size, AccessControlService.AuthContext context) {
        return mapper.searchExhibitions(keyword, province, city, status, page, size, context);
    }

    public Map<String, Object> getExhibition(long id, AccessControlService.AuthContext context) {
        return mapper.getExhibition(id, context);
    }

    public Map<String, Object> createExhibition(ExhibitionRequest request, long operatorId) {
        return mapper.createExhibition(request, operatorId);
    }

    public Map<String, Object> updateExhibition(long id, ExhibitionRequest request, AccessControlService.AuthContext context) {
        return mapper.updateExhibition(id, request, context);
    }

    public void deleteExhibition(long id, AccessControlService.AuthContext context) {
        mapper.deleteExhibition(id, context);
    }

    public Map<String, Object> linkNode(long exhibitionId, ExhibitionNodeRequest request, AccessControlService.AuthContext context) {
        return mapper.linkNode(exhibitionId, request, context);
    }

    public void unlinkNode(long exhibitionId, long nodeId, AccessControlService.AuthContext context) {
        mapper.unlinkNode(exhibitionId, nodeId, context);
    }

    public Map<String, Object> linkProduct(long exhibitionId, ProductLinkRequest request, AccessControlService.AuthContext context) {
        return mapper.linkProduct(exhibitionId, request, context);
    }

    public void unlinkProduct(long exhibitionId, long productId, AccessControlService.AuthContext context) {
        mapper.unlinkProduct(exhibitionId, productId, context);
    }
}
