package com.firetree.heritage.features.product.controller;

import java.util.Map;

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

import com.firetree.heritage.features.auth.service.AuthService;
import com.firetree.heritage.features.product.dto.ProductPurchaseRequest;
import com.firetree.heritage.features.product.dto.ProductRequest;
import com.firetree.heritage.features.product.dto.ProductReviewRequest;
import com.firetree.heritage.features.product.service.ProductService;
import com.firetree.heritage.features.system.service.AccessControlService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final AccessControlService accessControlService;
    private final AuthService authService;

    public ProductController(ProductService productService, AccessControlService accessControlService, AuthService authService) {
        this.productService = productService;
        this.accessControlService = accessControlService;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> products(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long relatedNodeId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "rating") String sort,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return productService.searchProducts(keyword, relatedNodeId, status, sort, page, size, context);
    }

    @GetMapping("/{id}")
    public Map<String, Object> product(
        @PathVariable long id,
        @RequestParam(defaultValue = "false") boolean backstage,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AccessControlService.AuthContext context = backstage ? accessControlService.requireBackstageWriter(authorization) : null;
        return productService.getProduct(id, context);
    }

    @PostMapping
    public Map<String, Object> createProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ProductRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return productService.createProduct(request, context);
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody ProductRequest request
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        return productService.updateProduct(id, request, context);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        AccessControlService.AuthContext context = accessControlService.requireBackstageWriter(authorization);
        productService.deleteProduct(id, context);
    }

    @PostMapping("/{id}/reviews")
    public Map<String, Object> createReview(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody ProductReviewRequest request
    ) {
        long userId = authService.requireUserId(authorization);
        return productService.createReview(id, request, userId);
    }

    @PostMapping("/{id}/purchase")
    public Map<String, Object> purchase(
        @PathVariable long id,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody ProductPurchaseRequest request
    ) {
        long buyerId = authService.requireUserId(authorization);
        return productService.purchase(id, request, buyerId, idempotencyKey);
    }

    @GetMapping("/purchase-orders")
    public Map<String, Object> purchaseOrders(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(required = false) Long buyerId,
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "ALL") String direction,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        AccessControlService.AuthContext context = accessControlService.requireUser(authorization);
        return productService.searchPurchaseOrders(buyerId, productId, keyword, status, direction, page, size, context);
    }

    @PutMapping("/purchase-orders/{logId}/status")
    public void updatePurchaseOrderStatus(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long logId,
        @RequestBody(required = false) Map<String, String> body
    ) {
        AccessControlService.AuthContext context = accessControlService.requireUser(authorization);
        productService.updatePurchaseOrderStatus(logId, body == null ? null : body.get("status"), context);
    }
}
