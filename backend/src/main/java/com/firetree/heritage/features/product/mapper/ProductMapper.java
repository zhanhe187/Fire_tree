package com.firetree.heritage.features.product.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.product.dto.ProductPurchaseRequest;
import com.firetree.heritage.features.product.dto.ProductRequest;
import com.firetree.heritage.features.product.dto.ProductReviewRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import com.firetree.heritage.features.system.service.AuditLogService;
import com.firetree.heritage.features.auth.mapper.UserLookupMapper;
import com.firetree.heritage.features.system.service.AccessControlService;

@Component
public class ProductMapper {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProductMapper.class);

    private static final List<String> VALID_STATUS = List.of("DRAFT", "PENDING", "APPROVED", "OFFLINE");

    private static final List<String> ORDER_STATUSES = List.of("PAID", "SHIPPED", "COMPLETED", "REFUNDED", "CANCELLED");

    /**
     * 订单状态迁移白名单：谁都不能跳步或回退，COMPLETED 起为终态。
     * 各角色能执行的目标状态在 updateOrderStatus 中按身份再收窄。
     */
    private static final Map<String, Set<String>> ORDER_STATUS_TRANSITIONS = Map.of(
        "PAID", Set.of("SHIPPED", "REFUNDED", "CANCELLED"),
        "SHIPPED", Set.of("COMPLETED", "REFUNDED", "CANCELLED"),
        "COMPLETED", Set.of(),
        "REFUNDED", Set.of(),
        "CANCELLED", Set.of()
    );

    private final MybatisSqlExecutor sqlExecutor;
    private final ObjectMapper objectMapper;
    private final UserLookupMapper userLookupMapper;
    private final AuditLogService auditLogService;
    private final TransactionTemplate reviewRecordTransaction;

    public ProductMapper(MybatisSqlExecutor sqlExecutor, ObjectMapper objectMapper, UserLookupMapper userLookupMapper, AuditLogService auditLogService, PlatformTransactionManager transactionManager) {
        this.sqlExecutor = sqlExecutor;
        this.objectMapper = objectMapper;
        this.userLookupMapper = userLookupMapper;
        this.auditLogService = auditLogService;
        this.reviewRecordTransaction = new TransactionTemplate(transactionManager);
        this.reviewRecordTransaction.setPropagationBehaviorName("PROPAGATION_REQUIRES_NEW");
    }

    public Map<String, Object> searchProducts(String keyword, Long relatedNodeId, String status, String sort, int page, int size, AccessControlService.AuthContext context) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, relatedNodeId, status, context, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from creative_products p
            left join graph_nodes n on n.id = p.related_node_id and n.deleted = 0
            left join sys_users u on u.id = p.owner_user_id and u.deleted = 0
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              p.id,
              p.product_code as productCode,
              p.name,
              p.description,
              p.cover_file_id as coverFileId,
              cover.preview_url as coverUrl,
              p.related_node_id as relatedNodeId,
              n.node_code as relatedNodeCode,
              n.name as relatedNodeName,
              p.owner_user_id as ownerUserId,
              u.username as ownerUsername,
              u.nickname as ownerName,
              p.external_url as externalUrl,
              p.price,
              p.stock,
              p.average_rating as averageRating,
              p.rating_count as ratingCount,
              p.status,
              p.created_at as createdAt,
              p.updated_at as updatedAt
            from creative_products p
            left join media_files cover on cover.id = p.cover_file_id and cover.deleted = 0
            left join graph_nodes n on n.id = p.related_node_id and n.deleted = 0
            left join sys_users u on u.id = p.owner_user_id and u.deleted = 0
            where %s
            order by %s
            limit ?, ?
            """.formatted(where, sortClause(sort)), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getProduct(long id, AccessControlService.AuthContext context) {
        ensureProductOwned(id, context);
        Map<String, Object> product = productById(id);
        if (context == null && !"APPROVED".equals(String.valueOf(product.get("status")))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        product.put("reviews", reviews(id));
        return product;
    }

    @Transactional
    public Map<String, Object> createProduct(ProductRequest request, AccessControlService.AuthContext context) {
        requireText(request.name(), "name is required");
        String productCode = request.productCode() == null || request.productCode().isBlank()
            ? generatedProductCode()
            : request.productCode().trim();
        Integer codeCount = sqlExecutor.queryForObject(
            "select count(*) from creative_products where product_code = ? and deleted = 0",
            Integer.class,
            productCode
        );
        if (codeCount != null && codeCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product code already exists");
        }
        if (request.relatedNodeId() != null) {
            ensureNodeExists(request.relatedNodeId());
        }
        Long ownerUserId = context.isSuperAdmin() && hasUserReference(request.ownerUserId(), request.ownerUsername())
            ? resolveOptionalUserId(request.ownerUserId(), request.ownerUsername(), "ownerUsername")
            : context.isSuperAdmin() ? userLookupMapper.defaultActiveUserId() : context.userId();
        if (request.coverFileId() != null) {
            ensureFileExists(request.coverFileId());
        }
        String status = normalizeStatus(request.status());

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into creative_products (
                  product_code, name, description, cover_file_id, related_node_id,
                owner_user_id, external_url, price, stock, status
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                productCode,
                request.name(),
                blankToNull(request.description()),
                request.coverFileId(),
                request.relatedNodeId(),
                ownerUserId,
                blankToNull(request.externalUrl()),
                request.price(),
                request.stock() == null ? 0 : request.stock(),
                status
            );
        } catch (DataIntegrityViolationException exception) {
            // Purge ghost soft-deleted row that may still occupy the unique key, then retry once
            sqlExecutor.update("delete from creative_products where product_code = ? and deleted = 1", productCode);
            try {
                id = sqlExecutor.insertAndReturnKey("""
                    insert into creative_products (
                      product_code, name, description, cover_file_id, related_node_id,
                    owner_user_id, external_url, price, stock, status
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    productCode,
                    request.name(),
                    blankToNull(request.description()),
                    request.coverFileId(),
                    request.relatedNodeId(),
                    ownerUserId,
                    blankToNull(request.externalUrl()),
                    request.price(),
                    request.stock() == null ? 0 : request.stock(),
                    status
                );
            } catch (DataIntegrityViolationException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Product code already exists");
            }
        }

        return getProduct(id, context);
    }

    @Transactional
    public Map<String, Object> updateProduct(long id, ProductRequest request, AccessControlService.AuthContext context) {
        ensureProductOwned(id, context);
        if (request.relatedNodeId() != null) {
            ensureNodeExists(request.relatedNodeId());
        }
        Long ownerUserId = context.isSuperAdmin()
            ? resolveOptionalUserId(request.ownerUserId(), request.ownerUsername(), "ownerUsername")
            : context.userId();
        if (request.coverFileId() != null) {
            ensureFileExists(request.coverFileId());
        }
        sqlExecutor.update("""
            update creative_products
            set
              name = coalesce(?, name),
              description = coalesce(?, description),
              cover_file_id = ?,
              related_node_id = ?,
              owner_user_id = ?,
              external_url = coalesce(?, external_url),
              price = ?,
              stock = coalesce(?, stock),
              status = coalesce(?, status)
            where id = ? and deleted = 0
            """,
            blankToNull(request.name()),
            blankToNull(request.description()),
            request.coverFileId(),
            request.relatedNodeId(),
            ownerUserId,
            blankToNull(request.externalUrl()),
            request.price(),
            request.stock(),
            request.status() == null || request.status().isBlank() ? null : normalizeStatus(request.status()),
            id
        );
        return getProduct(id, context);
    }

    @Transactional
    public void deleteProduct(long id, AccessControlService.AuthContext context) {
        ensureProductOwned(id, context);
        // Physical delete to prevent ghost rows from blocking unique-key re-creation
        sqlExecutor.update("delete from creative_products where id = ?", id);
    }

    public List<Map<String, Object>> findPurchaseOrders(Long buyerId, Long productId, String keyword, String status, String direction, int page, int size, AccessControlService.AuthContext context) {
        List<Object> params = new ArrayList<>();
        String where = buildPurchaseOrderWhere(buyerId, productId, keyword, status, direction, context, params);
        params.add((Math.max(page, 1) - 1) * Math.max(size, 1));
        params.add(Math.max(size, 1));
        List<Map<String, Object>> orders = sqlExecutor.queryForList("""
            select
              o.id,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.orderNo')) as orderNo,
              o.operator_id as buyerId,
              u.username as buyerUsername,
              u.nickname as buyerName,
              -- 产品可能已被删除：用下单时的 JSON 快照兜底，避免订单变孤儿
              -- （产品名/封面/卖家为空会让卖家在后台失去「发货」按钮）
              coalesce(p.owner_user_id,
                cast(JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.sellerId')) as unsigned)) as sellerId,
              seller.username as sellerUsername,
              coalesce(seller.nickname,
                JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.sellerName'))) as sellerName,
              o.resource_id as productId,
              coalesce(p.name,
                JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.productName'))) as productName,
              coalesce(cover.preview_url,
                JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.productCoverUrl'))) as productCoverUrl,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.quantity')) as quantity,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.unitPrice')) as unitPrice,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.total')) as total,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.address')) as address,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.contactName')) as contactName,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.contactPhone')) as contactPhone,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.status')) as status,
              o.created_at as createdAt,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.statusUpdatedAt')) as statusUpdatedAt
            from operation_logs o
            left join sys_users u on u.id = o.operator_id
            left join creative_products p on p.id = o.resource_id
            left join sys_users seller on seller.id = p.owner_user_id
            left join media_files cover on cover.id = p.cover_file_id and cover.deleted = 0
            where %s
            order by o.created_at desc, o.id desc
            limit ?, ?
            """.formatted(where), params.toArray());
        addOrderRoleFacts(orders, context.userId());
        return orders;
    }

    public Integer countPurchaseOrders(Long buyerId, Long productId, String keyword, String status, String direction, AccessControlService.AuthContext context) {
        List<Object> params = new ArrayList<>();
        String where = buildPurchaseOrderWhere(buyerId, productId, keyword, status, direction, context, params);
        return sqlExecutor.queryForObject("""
            select count(*)
            from operation_logs o
            left join sys_users u on u.id = o.operator_id
            left join creative_products p on p.id = o.resource_id
            where %s
            """.formatted(where), Integer.class, params.toArray());
    }

    /**
     * 各状态订单数（用于后台统计口径）：沿用同一组过滤条件，但**忽略 status 过滤**，
     * 否则按下某个状态筛选后统计只剩该状态、失去意义。
     */
    public Map<String, Object> countPurchaseOrdersByStatus(Long buyerId, Long productId, String keyword, String direction, AccessControlService.AuthContext context) {
        List<Object> params = new ArrayList<>();
        String where = buildPurchaseOrderWhere(buyerId, productId, keyword, null, direction, context, params);
        List<Map<String, Object>> rows = sqlExecutor.queryForList("""
            select
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.status')) as orderStatus,
              count(*) as total
            from operation_logs o
            left join sys_users u on u.id = o.operator_id
            left join creative_products p on p.id = o.resource_id
            where %s
            group by orderStatus
            """.formatted(where), params.toArray());
        Map<String, Object> summary = new LinkedHashMap<>();
        for (String status : ORDER_STATUSES) {
            summary.put(status, 0);
        }
        for (Map<String, Object> row : rows) {
            Object status = row.get("orderStatus");
            if (status == null) {
                continue;
            }
            summary.put(String.valueOf(status), row.get("total"));
        }
        return summary;
    }

    @Transactional
    public void updateOrderStatus(long logId, String nextStatus, AccessControlService.AuthContext context) {
        String target = normalizeOrderStatus(nextStatus);
        Map<String, Object> order = findPurchaseOrderForStatusUpdate(logId);
        String current = order.get("status") == null ? "" : String.valueOf(order.get("status"));
        Object buyerValue = order.get("buyerId");
        long buyerId = buyerValue instanceof Number buyer ? buyer.longValue() : -1L;
        Long sellerId = order.get("sellerId") instanceof Number seller ? seller.longValue() : null;
        long productId = ((Number) order.get("productId")).longValue();
        boolean isBuyer = buyerValue instanceof Number && buyerId == context.userId();
        boolean isSeller = sellerId != null && sellerId == context.userId();

        // 1) 显式迁移白名单：跳步（PAID→COMPLETED）、回退、终态再变更一律 400
        if (!ORDER_STATUS_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status transition is invalid");
        }
        // 2) 按身份收窄可执行的目标状态
        if (context.isSuperAdmin()) {
            // 管理员沿用白名单：可代发货/代确认，可对未完成订单退款或取消，但不能跳过 SHIPPED
        } else if (isBuyer && !isSeller) {
            boolean canCancelPaid = "PAID".equals(current) && "CANCELLED".equals(target);
            boolean canCompleteShipped = "SHIPPED".equals(current) && "COMPLETED".equals(target);
            if (!canCancelPaid && !canCompleteShipped) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Order status update is not permitted");
            }
        } else if (isSeller && !isBuyer && context.hasRole("INHERITOR")) {
            if (!("PAID".equals(current) && "SHIPPED".equals(target))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the inheritor seller may ship this order");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Order belongs to another user");
        }

        // 3) 原子认领状态：并发下只有一个请求能把 current 改成 target
        int affected = sqlExecutor.update("""
            update operation_logs
            set request_body = JSON_SET(
                  coalesce(request_body, JSON_OBJECT()),
                  '$.status', ?,
                  '$.statusUpdatedAt', ?,
                  '$.statusActorId', ?
                )
            where id = ? and operation = 'PRODUCT_PURCHASE' and resource_type = 'PRODUCT'
              and coalesce(JSON_UNQUOTE(JSON_EXTRACT(request_body, '$.status')), 'PAID') = ?
            """, target, LocalDateTime.now().toString(), context.userId(), logId, current);
        if (affected == 0) {
            // 认领失败说明状态已被并发请求改走（订单存在性已在 findPurchaseOrderForStatusUpdate 校验）
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status transition is invalid");
        }

        // 4) 认领成功后才归还库存：并发/重复退款不会重复加库存
        if ("REFUNDED".equals(target) || "CANCELLED".equals(target)) {
            restoreOrderStock(productId, order.get("quantity"));
        }

        // 5) 追加一条状态流水，保证"谁在何时把订单从什么状态改成了什么"可追溯
        auditLogService.recordOperation(
            context.userId(),
            "PRODUCT_ORDER_STATUS",
            "PRODUCT",
            productId,
            "PUT",
            "/api/products/purchase-orders/" + logId + "/status",
            Map.of("orderId", logId, "from", current, "to", target)
        );
    }

    /**
     * 归还库存。调用点必须已经原子认领过状态（见 updateOrderStatus 第 3 步），
     * 因此这里不再依赖"先读状态判重"，只做数量校验与产品存在性校验。
     */
    private void restoreOrderStock(long productId, Object quantityValue) {
        int quantity;
        try {
            quantity = quantityValue == null ? 0 : Integer.parseInt(String.valueOf(quantityValue).trim());
        } catch (NumberFormatException exception) {
            quantity = 0;
        }
        if (quantity <= 0) {
            // 数量异常时拒绝退款/取消（事务回滚，状态不变），避免"钱退了库存没还"
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order quantity is invalid");
        }
        int affected = sqlExecutor.update(
            "update creative_products set stock = stock + ? where id = ? and deleted = 0",
            quantity,
            productId
        );
        if (affected == 0) {
            // 产品已被删除：不阻断退款，但要留下可排查的痕迹
            LOGGER.warn("Order stock restore skipped: product {} missing or deleted", productId);
        }
    }

    /**
     * 订单过滤条件。
     * direction：ALL（角色默认范围）｜BUYING（我买的）｜SELLING（我卖的）。
     * status：可选，非白名单值直接 400，避免把任意字符串拼进查询。
     */
    private String buildPurchaseOrderWhere(Long buyerId, Long productId, String keyword, String status, String direction, AccessControlService.AuthContext context, List<Object> params) {
        StringBuilder where = new StringBuilder("o.operation = 'PRODUCT_PURCHASE' and o.resource_type = 'PRODUCT'");
        switch (normalizeOrderDirection(direction)) {
            case "BUYING" -> {
                where.append(" and o.operator_id = ?");
                params.add(context.userId());
            }
            case "SELLING" -> {
                where.append(" and p.owner_user_id = ?");
                params.add(context.userId());
            }
            default -> {
                if (context.isSuperAdmin()) {
                    if (buyerId != null) {
                        where.append(" and o.operator_id = ?");
                        params.add(buyerId);
                    }
                } else {
                    where.append(" and (o.operator_id = ? or p.owner_user_id = ?)");
                    params.add(context.userId());
                    params.add(context.userId());
                }
            }
        }
        if (productId != null) {
            where.append(" and o.resource_id = ?");
            params.add(productId);
        }
        if (status != null && !status.isBlank()) {
            where.append(" and JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.status')) = ?");
            params.add(normalizeOrderStatus(status));
        }
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (u.username like ? or u.nickname like ? or JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.orderNo')) like ? or p.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        return where.toString();
    }

    private void addOrderRoleFacts(List<Map<String, Object>> orders, long actorId) {
        for (Map<String, Object> order : orders) {
            // operator_id 允许为 NULL（外键 ON DELETE SET NULL），买家侧必须判空
            Object buyerValue = order.get("buyerId");
            Object sellerValue = order.get("sellerId");
            Long sellerId = sellerValue instanceof Number seller ? seller.longValue() : null;
            boolean isBuyer = buyerValue instanceof Number buyer && buyer.longValue() == actorId;
            order.put("isBuyer", isBuyer);
            order.put("isSeller", sellerId != null && sellerId == actorId);
            // 从未改过状态时，更新时间等于下单时间
            Object statusUpdatedAt = order.remove("statusUpdatedAt");
            order.put("updatedAt", statusUpdatedAt == null ? order.get("createdAt") : statusUpdatedAt);
        }
    }

    private Map<String, Object> findPurchaseOrderForStatusUpdate(long logId) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  o.id,
                  o.operator_id as buyerId,
                  o.resource_id as productId,
                  p.owner_user_id as sellerId,
                  -- 老数据/异常数据可能没有 status：按订单初始态 PAID 处理，避免整条流程断掉
                  coalesce(JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.status')), 'PAID') as status,
                  JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.quantity')) as quantity
                from operation_logs o
                left join creative_products p on p.id = o.resource_id
                where o.id = ? and o.operation = 'PRODUCT_PURCHASE' and o.resource_type = 'PRODUCT'
                """, logId);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
    }

    private String normalizeOrderStatus(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        return switch (normalized) {
            case "PAID", "SHIPPED", "COMPLETED", "REFUNDED", "CANCELLED" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        };
    }

    private String normalizeOrderDirection(String value) {
        String normalized = value == null || value.isBlank() ? "ALL" : value.trim().toUpperCase();
        return switch (normalized) {
            case "ALL", "BUYING", "SELLING" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "direction is invalid");
        };
    }

    @Transactional
    public Map<String, Object> createReview(long productId, ProductReviewRequest request, long userId) {
        ensureProductExists(productId);
        if (request.rating() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rating is required");
        }
        moderate("PRODUCT_REVIEW", request.content());

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into product_reviews (product_id, user_id, rating, content, status)
                values (?, ?, ?, ?, 'PUBLISHED')
                """,
                productId,
                userId,
                request.rating(),
                blankToNull(request.content())
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product already reviewed by this user");
        }

        refreshRating(productId);
        return review(id);
    }

    @Transactional
    public Map<String, Object> purchase(long productId, ProductPurchaseRequest request, long buyerId, String idempotencyKey) {
        ensureProductExists(productId);
        int quantity = request.quantity() == null ? 1 : Math.max(1, request.quantity());
        Map<String, Object> product = productById(productId);
        if (!"APPROVED".equals(String.valueOf(product.get("status")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not available for purchase");
        }
        Object ownerValue = product.get("ownerUserId");
        if (ownerValue instanceof Number owner && owner.longValue() == buyerId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sellers cannot purchase their own product");
        }
        BigDecimal price = (BigDecimal) product.get("price");
        if (price == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price is not set");
        }

        Integer stock = sqlExecutor.queryForObject("select stock from creative_products where id = ? and deleted = 0", Integer.class, productId);
        if (stock == null || stock < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock");
        }

        int affected = sqlExecutor.update("update creative_products set stock = stock - ? where id = ? and stock >= ?", quantity, productId, quantity);
        if (affected == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock");
        }

        String orderNo = generatedOrderNo();
        BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
        Map<String, Object> orderSnapshot = new LinkedHashMap<>();
        orderSnapshot.put("orderNo", orderNo);
        orderSnapshot.put("quantity", quantity);
        orderSnapshot.put("unitPrice", price);
        orderSnapshot.put("total", total);
        orderSnapshot.put("address", blankToNull(request.address()));
        orderSnapshot.put("contactName", blankToNull(request.contactName()));
        orderSnapshot.put("contactPhone", blankToNull(request.contactPhone()));
        orderSnapshot.put("status", "PAID");
        orderSnapshot.put("buyerId", buyerId);
        orderSnapshot.put("productName", product.get("name"));
        orderSnapshot.put("productCoverUrl", product.get("coverUrl"));
        // 卖家信息一并快照：产品被删除后订单仍能显示卖家并允许发货
        orderSnapshot.put("sellerId", product.get("ownerUserId"));
        orderSnapshot.put("sellerName", product.get("ownerName") != null
            ? product.get("ownerName")
            : product.get("ownerUsername"));
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            orderSnapshot.put("idempotencyKey", idempotencyKey);
        }

        // 订单写入必须与扣库存同生共死：这里不再走"失败静默"的审计通道，
        // 否则会出现库存已扣、订单查不到的不可补救状态。
        int inserted = sqlExecutor.update("""
            insert into operation_logs (
              operator_id, operation, resource_type, resource_id, request_method, request_uri, request_body, success
            ) values (?, 'PRODUCT_PURCHASE', 'PRODUCT', ?, 'POST', ?, cast(? as json), 1)
            """,
            buyerId,
            productId,
            "/api/products/" + productId + "/purchase",
            orderSnapshotJson(orderSnapshot)
        );
        if (inserted != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to persist order");
        }

        return Map.of(
            "orderNo", orderNo,
            "productId", productId,
            "quantity", quantity,
            "total", total,
            "status", "PAID",
            "reused", false
        );
    }

    /** 幂等查询：同一买家 + 同一 Idempotency-Key 只应存在一张订单。 */
    public Map<String, Object> findPurchaseOrderByKey(long buyerId, String idempotencyKey) {
        List<Map<String, Object>> rows = sqlExecutor.queryForList("""
            select
              o.id,
              o.resource_id as productId,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.orderNo')) as orderNo,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.quantity')) as quantity,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.total')) as total,
              JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.status')) as status
            from operation_logs o
            where o.operation = 'PRODUCT_PURCHASE' and o.resource_type = 'PRODUCT'
              and o.operator_id = ?
              and JSON_UNQUOTE(JSON_EXTRACT(o.request_body, '$.idempotencyKey')) = ?
            order by o.id desc
            limit 1
            """, buyerId, idempotencyKey);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private String generatedOrderNo() {
        return "order_%s_%s".formatted(
            LocalDateTime.now().toString().replaceAll("[^0-9]", "").substring(0, 14),
            UUID.randomUUID().toString().substring(0, 8)
        );
    }

    private String orderSnapshotJson(Map<String, Object> orderSnapshot) {
        try {
            return objectMapper.writeValueAsString(orderSnapshot);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to persist order snapshot");
        }
    }

    private Map<String, Object> productById(long id) {
        try {
            return new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  p.id,
                  p.product_code as productCode,
                  p.name,
                  p.description,
                  p.cover_file_id as coverFileId,
                  cover.preview_url as coverUrl,
                  p.related_node_id as relatedNodeId,
                  n.node_code as relatedNodeCode,
                  n.name as relatedNodeName,
                  p.owner_user_id as ownerUserId,
                  u.username as ownerUsername,
                  u.nickname as ownerName,
                  p.external_url as externalUrl,
                  p.price,
                  p.stock,
                  p.average_rating as averageRating,
                  p.rating_count as ratingCount,
                  p.status,
                  p.created_at as createdAt,
                  p.updated_at as updatedAt
                from creative_products p
                left join media_files cover on cover.id = p.cover_file_id and cover.deleted = 0
                left join graph_nodes n on n.id = p.related_node_id and n.deleted = 0
                left join sys_users u on u.id = p.owner_user_id and u.deleted = 0
                where p.id = ? and p.deleted = 0
                """, id));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
    }

    private List<Map<String, Object>> reviews(long productId) {
        return sqlExecutor.queryForList("""
            select
              r.id,
              r.product_id as productId,
              r.user_id as userId,
              u.nickname as userName,
              r.rating,
              r.content,
              r.reply_content as replyContent,
              r.status,
              r.created_at as createdAt,
              r.updated_at as updatedAt
            from product_reviews r
            join sys_users u on u.id = r.user_id
            where r.product_id = ?
              and r.deleted = 0
              and r.status = 'PUBLISHED'
            order by r.created_at desc, r.id desc
            """, productId);
    }

    private Map<String, Object> review(long id) {
        try {
            return sqlExecutor.queryForMap("""
                select
                  r.id,
                  r.product_id as productId,
                  r.user_id as userId,
                  u.nickname as userName,
                  r.rating,
                  r.content,
                  r.reply_content as replyContent,
                  r.status,
                  r.created_at as createdAt,
                  r.updated_at as updatedAt
                from product_reviews r
                join sys_users u on u.id = r.user_id
                where r.id = ? and r.deleted = 0
                """, id);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
    }

    private String buildWhere(String keyword, Long relatedNodeId, String status, AccessControlService.AuthContext context, List<Object> params) {
        StringBuilder where = new StringBuilder("p.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (p.product_code like ? or p.name like ? or p.description like ? or n.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (relatedNodeId != null) {
            where.append(" and p.related_node_id = ?");
            params.add(relatedNodeId);
        }
        if (status != null && !status.isBlank()) {
            where.append(" and p.status = ?");
            params.add(normalizeStatus(status));
        }
        if (context != null && !context.isSuperAdmin()) {
            where.append(" and p.owner_user_id = ?");
            params.add(context.userId());
        }
        return where.toString();
    }

    private String sortClause(String sort) {
        String normalized = sort == null ? "" : sort.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "price" -> "p.price is null, p.price asc, p.id desc";
            case "newest" -> "p.updated_at desc, p.id desc";
            default -> "p.average_rating desc, p.rating_count desc, p.updated_at desc, p.id desc";
        };
    }

    private void moderate(String contentType, String rawContent) {
        List<String> matchedWords = findSensitiveWords(rawContent);
        if (matchedWords.isEmpty()) {
            return;
        }
        reviewRecordTransaction.executeWithoutResult(status -> sqlExecutor.update("""
                insert into content_review_records (content_type, content_id, raw_content, matched_words, status)
                values (?, 0, ?, ?, 'BLOCKED')
                """,
                contentType,
                rawContent,
                toJson(matchedWords)
            )
        );
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content contains sensitive words");
    }

    private List<String> findSensitiveWords(String rawContent) {
        String normalizedContent = rawContent == null ? "" : rawContent.toLowerCase(Locale.ROOT);
        if (normalizedContent.isBlank()) {
            return List.of();
        }
        List<String> words = sqlExecutor.queryForList("""
            select word
            from sensitive_words
            where status = 1 and deleted = 0
            """, String.class);
        return words.stream()
            .filter(word -> normalizedContent.contains(word.toLowerCase(Locale.ROOT)))
            .toList();
    }

    private void refreshRating(long productId) {
        sqlExecutor.update("""
            update creative_products p
            left join (
              select product_id, round(avg(rating), 2) as averageRating, count(*) as ratingCount
              from product_reviews
              where product_id = ? and deleted = 0 and status = 'PUBLISHED'
              group by product_id
            ) r on r.product_id = p.id
            set p.average_rating = coalesce(r.averageRating, 0),
                p.rating_count = coalesce(r.ratingCount, 0)
            where p.id = ?
            """, productId, productId);
    }

    private void ensureProductExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from creative_products where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
    }

    private void ensureProductOwned(long id, AccessControlService.AuthContext context) {
        ensureProductExists(id);
        if (context == null || context.isSuperAdmin()) {
            return;
        }
        Long ownerUserId = sqlExecutor.queryForObject(
            "select owner_user_id from creative_products where id = ? and deleted = 0",
            Long.class,
            id
        );
        if (ownerUserId == null || ownerUserId != context.userId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Product belongs to another user");
        }
    }

    private void ensureNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "relatedNodeId is invalid");
        }
    }

    private Long resolveOptionalUserId(Long userId, String username, String fieldName) {
        if (userId == null && (username == null || username.isBlank())) {
            return null;
        }
        return userLookupMapper.resolveUserId(userId, username, fieldName);
    }

    private boolean hasUserReference(Long userId, String username) {
        return userId != null || (username != null && !username.isBlank());
    }

    private String generatedProductCode() {
        return "product_" + UUID.randomUUID().toString().replace("-", "");
    }

    private void ensureFileExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from media_files where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "coverFileId is invalid");
        }
    }

    private String normalizeStatus(String value) {
        String normalized = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid");
        }
        return normalized;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content review payload is invalid");
        }
    }
}
