package com.firetree.heritage.features.exhibition.controller;

import com.firetree.heritage.features.exhibition.dto.ExhibitionNodeRequest;
import com.firetree.heritage.features.exhibition.dto.ExhibitionRequest;
import com.firetree.heritage.features.product.dto.ProductLinkRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.exhibition.service.ExhibitionService;
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
@RequestMapping("/api/exhibitions")
public class ExhibitionController {

    private final ExhibitionService exhibitionService;
    private final AccessControlService accessControlService;

    public ExhibitionController(ExhibitionService exhibitionService, AccessControlService accessControlService) {
        this.exhibitionService = exhibitionService;
        this.accessControlService = accessControlService;
    }

    @GetMapping
    public Map<String, Object> exhibitions(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String province,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return exhibitionService.searchExhibitions(keyword, province, city, status, page, size, context);
    }

    @GetMapping("/{id}")
    public Map<String, Object> exhibition(
        @PathVariable long id,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return exhibitionService.getExhibition(id, context);
    }

    @PostMapping
    public Map<String, Object> createExhibition(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ExhibitionRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return exhibitionService.createExhibition(request, context.userId());
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateExhibition(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ExhibitionRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return exhibitionService.updateExhibition(id, request, context);
    }

    @DeleteMapping("/{id}")
    public void deleteExhibition(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        exhibitionService.deleteExhibition(id, context);
    }

    @PostMapping("/{id}/nodes")
    public Map<String, Object> linkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ExhibitionNodeRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return exhibitionService.linkNode(id, request, context);
    }

    @DeleteMapping("/{id}/nodes/{nodeId}")
    public void unlinkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @PathVariable long nodeId
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        exhibitionService.unlinkNode(id, nodeId, context);
    }

    @PostMapping("/{id}/products")
    public Map<String, Object> linkProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ProductLinkRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return exhibitionService.linkProduct(id, request, context);
    }

    @DeleteMapping("/{id}/products/{productId}")
    public void unlinkProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @PathVariable long productId
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        exhibitionService.unlinkProduct(id, productId, context);
    }
}
