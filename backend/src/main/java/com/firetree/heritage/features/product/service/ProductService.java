package com.firetree.heritage.features.product.service;

import com.firetree.heritage.features.product.dto.ProductPurchaseRequest;
import com.firetree.heritage.features.product.dto.ProductRequest;
import com.firetree.heritage.features.product.dto.ProductReviewRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.firetree.heritage.features.product.mapper.ProductMapper;
import com.firetree.heritage.features.system.service.AccessControlService;

@Service
public class ProductService {

    private static final int MAX_ORDER_PAGE_SIZE = 100;
    private static final int MAX_IDEMPOTENCY_KEY_LENGTH = 128;

    /**
     * 幂等键分片锁：同一 (buyerId, Idempotency-Key) 的并发下单在进程内串行，
     * 配合"先查后写"让重复提交只落一张订单。
     * 限制：只在单实例部署内有效；多实例部署仍需数据库唯一约束（见审计报告待确认项）。
     */
    private static final Object[] IDEMPOTENCY_LOCKS = createIdempotencyLocks();

    private final ProductMapper mapper;

    public ProductService(ProductMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchProducts(String keyword, Long relatedNodeId, String status, String sort, int page, int size, AccessControlService.AuthContext context) {
        return mapper.searchProducts(keyword, relatedNodeId, status, sort, page, size, context);
    }

    public Map<String, Object> getProduct(long id, AccessControlService.AuthContext context) {
        return mapper.getProduct(id, context);
    }

    public Map<String, Object> createProduct(ProductRequest request, AccessControlService.AuthContext context) {
        return mapper.createProduct(request, context);
    }

    public Map<String, Object> updateProduct(long id, ProductRequest request, AccessControlService.AuthContext context) {
        return mapper.updateProduct(id, request, context);
    }

    public void deleteProduct(long id, AccessControlService.AuthContext context) {
        mapper.deleteProduct(id, context);
    }

    public Map<String, Object> createReview(long productId, ProductReviewRequest request, long userId) {
        return mapper.createReview(productId, request, userId);
    }

    public Map<String, Object> purchase(long productId, ProductPurchaseRequest request, long buyerId, String idempotencyKey) {
        String key = idempotencyKey == null ? "" : idempotencyKey.trim();
        if (key.isEmpty()) {
            return mapper.purchase(productId, request, buyerId, null);
        }
        if (key.length() > MAX_IDEMPOTENCY_KEY_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key is too long");
        }
        synchronized (idempotencyLock(buyerId, key)) {
            Map<String, Object> existing = mapper.findPurchaseOrderByKey(buyerId, key);
            if (existing != null) {
                return reusedPurchaseResult(existing);
            }
            return mapper.purchase(productId, request, buyerId, key);
        }
    }

    public Map<String, Object> searchPurchaseOrders(Long buyerId, Long productId, String keyword, String status, String direction, int page, int size, AccessControlService.AuthContext context) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), MAX_ORDER_PAGE_SIZE);
        String safeDirection = normalizeDirection(direction);
        List<Map<String, Object>> items = mapper.findPurchaseOrders(buyerId, productId, keyword, status, safeDirection, safePage, safeSize, context);
        Integer total = mapper.countPurchaseOrders(buyerId, productId, keyword, status, safeDirection, context);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("direction", safeDirection);
        // 统计不受 status 过滤影响：否则一按状态筛选，各状态数量就失去参考价值
        result.put("summary", mapper.countPurchaseOrdersByStatus(buyerId, productId, keyword, safeDirection, context));
        result.put("items", items);
        return result;
    }

    public void updatePurchaseOrderStatus(long logId, String nextStatus, AccessControlService.AuthContext context) {
        mapper.updateOrderStatus(logId, nextStatus, context);
    }

    private Map<String, Object> reusedPurchaseResult(Map<String, Object> order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderNo", order.get("orderNo"));
        result.put("productId", order.get("productId"));
        result.put("quantity", parseInteger(order.get("quantity")));
        result.put("total", parseDecimal(order.get("total")));
        result.put("status", order.get("status"));
        result.put("reused", true);
        return result;
    }

    private Integer parseInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private BigDecimal parseDecimal(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String normalizeDirection(String direction) {
        String normalized = direction == null || direction.isBlank() ? "ALL" : direction.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ALL", "BUYING", "SELLING" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "direction is invalid");
        };
    }

    private static Object[] createIdempotencyLocks() {
        Object[] locks = new Object[64];
        for (int index = 0; index < locks.length; index += 1) {
            locks[index] = new Object();
        }
        return locks;
    }

    private Object idempotencyLock(long buyerId, String idempotencyKey) {
        return IDEMPOTENCY_LOCKS[Math.floorMod(Objects.hash(buyerId, idempotencyKey), IDEMPOTENCY_LOCKS.length)];
    }
}
