package com.firetree.heritage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OrderPermissionApiTest {

    private String scopePrefix;
    private String orderNoPrefix;
    private String productCodePrefix;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void initializeScope() {
        scopePrefix = "orderperm_" + UUID.randomUUID().toString().substring(0, 12) + "_";
        orderNoPrefix = scopePrefix + "order_";
        productCodePrefix = scopePrefix + "product_";
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update("delete from operation_logs where JSON_UNQUOTE(JSON_EXTRACT(request_body, '$.orderNo')) like ?", orderNoPrefix + "%");
        jdbcTemplate.update("delete from operation_logs where operator_id in (select id from sys_users where username like ?)", scopePrefix + "%");
        jdbcTemplate.update("delete from creative_products where product_code like ?", productCodePrefix + "%");
        jdbcTemplate.update("delete from sys_user_roles where user_id in (select id from sys_users where username like ?)", scopePrefix + "%");
        jdbcTemplate.update("delete from sys_users where username like ?", scopePrefix + "%");
    }

    private long ensureUser(String suffix, String userType, String roleCode) {
        String username = username(suffix);
        jdbcTemplate.update("""
            insert into sys_users (username, password_hash, nickname, user_type)
            values (?, '{noop}test', ?, ?)
            on duplicate key update
              password_hash = values(password_hash),
              nickname = values(nickname),
              user_type = values(user_type),
              status = 1,
              deleted = 0
            """, username, username, userType);
        long userId = jdbcTemplate.queryForObject("select id from sys_users where username = ?", Long.class, username);
        jdbcTemplate.update("""
            insert into sys_user_roles (user_id, role_id)
            select ?, id from sys_roles where role_code = ?
            on duplicate key update user_id = values(user_id)
            """, userId, roleCode);
        return userId;
    }

    private long insertOrder(long buyerId, long productId, String orderNo, String status) {
        jdbcTemplate.update("""
            insert into operation_logs
              (operator_id, operation, resource_type, resource_id, request_method, request_uri, request_body, success)
            values (?, 'PRODUCT_PURCHASE', 'PRODUCT', ?, 'POST', ?, cast(? as json), 1)
            """,
            buyerId, productId, "/api/products/" + productId + "/purchase",
            "{\"orderNo\":\"" + orderNo + "\",\"quantity\":1,\"unitPrice\":38.0,\"total\":38.0,\"status\":\"" + status + "\",\"buyerId\":" + buyerId + "}"
        );
        return jdbcTemplate.queryForObject(
            "select id from operation_logs where JSON_UNQUOTE(JSON_EXTRACT(request_body, '$.orderNo')) = ?", Long.class, orderNo
        );
    }

    private long insertOrder(long buyerId, long productId, String orderNo) {
        return insertOrder(buyerId, productId, orderNo, "PAID");
    }

    private long insertOrderWithNullBody(long buyerId, long productId) {
        jdbcTemplate.update("""
            insert into operation_logs
              (operator_id, operation, resource_type, resource_id, request_method, request_uri, request_body, success)
            values (?, 'PRODUCT_PURCHASE', 'PRODUCT', ?, 'POST', ?, null, 1)
            """,
            buyerId, productId, "/api/products/" + productId + "/purchase"
        );
        return jdbcTemplate.queryForObject(
            "select max(id) from operation_logs where operator_id = ? and resource_id = ? and operation = 'PRODUCT_PURCHASE'",
            Long.class, buyerId, productId
        );
    }

    private long insertProduct(long ownerId, String suffix) {
        return insertProduct(ownerId, suffix, "APPROVED");
    }

    private long insertProduct(long ownerId, String suffix, String status) {
        String code = productCodePrefix + suffix;
        jdbcTemplate.update("""
            insert into creative_products (product_code, name, owner_user_id, price, stock, status)
            values (?, ?, ?, 38.0, 10, ?)
            """, code, code, ownerId, status);
        return jdbcTemplate.queryForObject("select id from creative_products where product_code = ?", Long.class, code);
    }

    private String loginToken(String suffix) {
        String username = username(suffix);
        Map<?, ?> captcha = restTemplate.getForObject(url("/api/auth/captcha"), Map.class);
        String captchaId = String.valueOf(captcha.get("captchaId"));
        String code = String.valueOf(captcha.get("debugCode"));
        ResponseEntity<Map> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            Map.of("username", username, "password", "test", "captchaId", captchaId, "captchaCode", code),
            Map.class
        );
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        return String.valueOf(login.getBody().get("token"));
    }

    private String username(String suffix) {
        return scopePrefix + suffix;
    }

    private ResponseEntity<Map> ordersAs(String token, String query) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(url("/api/products/purchase-orders" + query), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    @Test
    void purchaseRejectsOfflineProduct() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(sellerId, "offline_product", "OFFLINE");

        ResponseEntity<Map> response = purchaseAs(loginToken("buyer"), productId);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void purchaseRejectsDraftProduct() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(sellerId, "draft_product", "DRAFT");

        ResponseEntity<Map> response = purchaseAs(loginToken("buyer"), productId);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void sellerCannotPurchaseOwnProduct() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long productId = insertProduct(sellerId, "own_product");

        ResponseEntity<Map> response = purchaseAs(loginToken("seller"), productId);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void buyerCanPurchaseApprovedProductFromAnotherSeller() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(sellerId, "approved_product");

        ResponseEntity<Map> response = purchaseAs(loginToken("buyer"), productId);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(stockOf(productId)).isEqualTo(9);
    }

    private int stockOf(long productId) {
        Integer stock = jdbcTemplate.queryForObject("select stock from creative_products where id = ?", Integer.class, productId);
        return stock == null ? -1 : stock;
    }

    private ResponseEntity<Map> purchaseAs(String token, long productId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        Map<String, Object> body = Map.of(
            "quantity", 1,
            "address", "test address",
            "contactName", "buyer",
            "contactPhone", "13800000000"
        );
        return restTemplate.exchange(
            url("/api/products/" + productId + "/purchase"),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    @SuppressWarnings("unchecked")
    @Test
    void adminSeesAllOrdersWithoutBuyerFilter() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long inheritorId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long learnerId = ensureUser("learner", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(adminId, "shared");
        insertOrder(adminId, productId, orderNoPrefix + "admin");
        insertOrder(inheritorId, productId, orderNoPrefix + "inheritor");
        insertOrder(learnerId, productId, orderNoPrefix + "learner");

        ResponseEntity<Map> response = ordersAs(loginToken("admin"), "?page=1&size=20");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
        long prefixed = items.stream()
            .filter(item -> String.valueOf(item.get("orderNo")).startsWith(orderNoPrefix))
            .count();
        assertThat(prefixed).isEqualTo(3);
    }

    @SuppressWarnings("unchecked")
    @Test
    void adminCanFilterOrdersByBuyerId() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long learnerId = ensureUser("learner", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(adminId, "shared");
        insertOrder(adminId, productId, orderNoPrefix + "admin");
        insertOrder(learnerId, productId, orderNoPrefix + "learner");

        ResponseEntity<Map> response = ordersAs(loginToken("admin"), "?buyerId=" + learnerId + "&page=1&size=20");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
        assertThat(items).hasSize(1);
        assertThat(String.valueOf(items.get(0).get("buyerId"))).isEqualTo(String.valueOf(learnerId));
    }

    @SuppressWarnings("unchecked")
    @Test
    void learnerSeesOnlyOwnOrdersAndCannotReadOthersViaBuyerParam() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long learnerId = ensureUser("learner", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(adminId, "shared");
        insertOrder(adminId, productId, orderNoPrefix + "admin");
        insertOrder(learnerId, productId, orderNoPrefix + "learner");

        String token = loginToken("learner");

        ResponseEntity<Map> own = ordersAs(token, "?page=1&size=20");
        assertThat(own.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> ownItems = (List<Map<String, Object>>) own.getBody().get("items");
        assertThat(ownItems).hasSize(1);
        assertThat(String.valueOf(ownItems.get(0).get("buyerId"))).isEqualTo(String.valueOf(learnerId));

        ResponseEntity<Map> spoofed = ordersAs(token, "?buyerId=" + adminId + "&page=1&size=20");
        assertThat(spoofed.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> spoofedItems = (List<Map<String, Object>>) spoofed.getBody().get("items");
        assertThat(spoofedItems).hasSize(1);
        assertThat(String.valueOf(spoofedItems.get(0).get("buyerId"))).isEqualTo(String.valueOf(learnerId));
    }

    @SuppressWarnings("unchecked")
    @Test
    void inheritorSeesOnlyOwnOrders() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long inheritorId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long productId = insertProduct(adminId, "shared");
        insertOrder(adminId, productId, orderNoPrefix + "admin");
        insertOrder(inheritorId, productId, orderNoPrefix + "inheritor");

        ResponseEntity<Map> response = ordersAs(loginToken("inheritor"), "?page=1&size=20");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
        assertThat(items).hasSize(1);
        assertThat(String.valueOf(items.get(0).get("buyerId"))).isEqualTo(String.valueOf(inheritorId));
    }

    @Test
    void unauthenticatedOrderQueryIsRejected() {
        ResponseEntity<Map> response = restTemplate.exchange(
            url("/api/products/purchase-orders?page=1&size=20"),
            HttpMethod.GET, HttpEntity.EMPTY, Map.class
        );
        assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @SuppressWarnings("unchecked")
    @Test
    void inheritorSeesOwnPurchaseAndSaleOfOwnedProductWithRoleFacts() {
        long inheritorId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long otherId = ensureUser("other", "NORMAL", "NORMAL_USER");
        long unrelatedId = ensureUser("unrelated", "NORMAL", "NORMAL_USER");
        long inheritedProduct = insertProduct(inheritorId, "owned");
        long otherProduct = insertProduct(otherId, "other");
        long unrelatedProduct = insertProduct(unrelatedId, "unrelated");
        long purchaseId = insertOrder(inheritorId, otherProduct, orderNoPrefix + "inheritor_purchase");
        long saleId = insertOrder(otherId, inheritedProduct, orderNoPrefix + "inheritor_sale");
        insertOrder(unrelatedId, unrelatedProduct, orderNoPrefix + "unrelated");

        ResponseEntity<Map> response = ordersAs(loginToken("inheritor"), "?page=1&size=20");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
        List<Map<String, Object>> scoped = items.stream()
            .filter(item -> String.valueOf(item.get("orderNo")).startsWith(orderNoPrefix))
            .toList();
        assertThat(scoped).hasSize(2);
        assertThat(((Number) response.getBody().get("total")).longValue()).isEqualTo(2);
        Map<String, Object> purchase = scoped.stream()
            .filter(item -> ((Number) item.get("id")).longValue() == purchaseId)
            .findFirst().orElseThrow();
        Map<String, Object> sale = scoped.stream()
            .filter(item -> ((Number) item.get("id")).longValue() == saleId)
            .findFirst().orElseThrow();
        assertThat(purchase.get("isBuyer")).isEqualTo(true);
        assertThat(purchase.get("isSeller")).isEqualTo(false);
        assertThat(sale.get("isBuyer")).isEqualTo(false);
        assertThat(sale.get("isSeller")).isEqualTo(true);
    }

    @Test
    void inheritorSellerCanShipOwnPaidSale() {
        long sellerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "sale"), orderNoPrefix + "seller_can_ship");

        ResponseEntity<Void> response = updateOrderAs(loginToken("inheritor"), orderId, "SHIPPED");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(orderStatus(orderId)).isEqualTo("SHIPPED");
    }

    @Test
    void inheritorSellerCannotShipOwnAlreadyShippedSale() {
        long sellerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(
            buyerId,
            insertProduct(sellerId, "already_shipped_sale"),
            orderNoPrefix + "seller_cannot_reship",
            "SHIPPED"
        );

        ResponseEntity<Void> response = updateOrderAs(loginToken("inheritor"), orderId, "SHIPPED");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("SHIPPED");
    }

    @Test
    void inheritorSellerCannotShipTheSameSaleTwice() {
        long sellerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "ship_once"), orderNoPrefix + "seller_ship_once");
        String token = loginToken("inheritor");

        ResponseEntity<Void> first = updateOrderAs(token, orderId, "SHIPPED");
        ResponseEntity<Void> second = updateOrderAs(token, orderId, "SHIPPED");

        assertThat(first.getStatusCode().value()).isEqualTo(200);
        assertThat(second.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("SHIPPED");
    }

    @Test
    void inheritorSellerCannotShipTheirOwnPurchase() {
        long buyerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long sellerId = ensureUser("seller", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "purchase"), orderNoPrefix + "seller_cannot_ship_purchase");

        ResponseEntity<Void> response = updateOrderAs(loginToken("inheritor"), orderId, "SHIPPED");

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(orderStatus(orderId)).isEqualTo("PAID");
    }

    @Test
    void inheritorBuyerCanCompleteOwnShippedPurchase() {
        long buyerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long sellerId = ensureUser("seller", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "shipped_purchase"), orderNoPrefix + "buyer_can_complete", "SHIPPED");

        ResponseEntity<Void> response = updateOrderAs(loginToken("inheritor"), orderId, "COMPLETED");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(orderStatus(orderId)).isEqualTo("COMPLETED");
    }

    @Test
    void inheritorBuyerCannotCompletePurchaseBeforeShipment() {
        long buyerId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long sellerId = ensureUser("seller", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "paid_purchase"), orderNoPrefix + "buyer_cannot_complete");

        ResponseEntity<Void> response = updateOrderAs(loginToken("inheritor"), orderId, "COMPLETED");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("PAID");
    }

    @Test
    void unrelatedActorCannotUpdateAnotherPartysOrder() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        ensureUser("unrelated", "INHERITOR", "INHERITOR");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "unrelated"), orderNoPrefix + "unrelated_actor");

        ResponseEntity<Void> response = updateOrderAs(loginToken("unrelated"), orderId, "SHIPPED");

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(orderStatus(orderId)).isEqualTo("PAID");
    }

    @Test
    void nullStatusRequestBodyIsRejectedAsInvalidStatus() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long orderId = insertOrder(adminId, insertProduct(adminId, "null_request"), orderNoPrefix + "null_request");

        ResponseEntity<Void> response = updateOrderWithRawBody(loginToken("admin"), orderId, "null");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("PAID");
    }

    @Test
    void adminRefundRestoresStockOnlyOnce() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long productId = insertProduct(adminId, "refund_stock", "APPROVED");
        jdbcTemplate.update("update creative_products set stock = 9 where id = ?", productId);
        long orderId = insertOrder(adminId, productId, orderNoPrefix + "refund_once");
        String token = loginToken("admin");

        ResponseEntity<Void> first = updateOrderAs(token, orderId, "REFUNDED");
        // 重复退款按"非法迁移"拒绝（白名单里 REFUNDED 没有出边），库存只归还一次
        ResponseEntity<Void> second = updateOrderAs(token, orderId, "REFUNDED");

        assertThat(first.getStatusCode().value()).isEqualTo(200);
        assertThat(second.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("REFUNDED");
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void concurrentRefundRestoresStockOnlyOnce() throws Exception {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long productId = insertProduct(adminId, "concurrent_refund", "APPROVED");
        jdbcTemplate.update("update creative_products set stock = 9 where id = ?", productId);
        long orderId = insertOrder(adminId, productId, orderNoPrefix + "concurrent_refund");
        String token = loginToken("admin");

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> futures = new ArrayList<>();
        for (int index = 0; index < 2; index += 1) {
            futures.add(pool.submit(() -> {
                start.await();
                return updateOrderAs(token, orderId, "REFUNDED").getStatusCode().value();
            }));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> future : futures) {
            statuses.add(future.get(30, TimeUnit.SECONDS));
        }
        pool.shutdown();

        // 并发下只有一个请求能认领 PAID→REFUNDED，另一个被拒，库存只 +1
        assertThat(statuses).containsExactlyInAnyOrder(200, 400);
        assertThat(orderStatus(orderId)).isEqualTo("REFUNDED");
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void completedOrderIsTerminalAndCannotBeRefunded() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long productId = insertProduct(adminId, "completed_terminal", "APPROVED");
        jdbcTemplate.update("update creative_products set stock = 9 where id = ?", productId);
        long orderId = insertOrder(adminId, productId, orderNoPrefix + "completed_terminal", "COMPLETED");

        ResponseEntity<Void> response = updateOrderAs(loginToken("admin"), orderId, "REFUNDED");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("COMPLETED");
        assertThat(stockOf(productId)).isEqualTo(9);
    }

    @Test
    void adminCannotSkipShipmentToCompletePaidOrder() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long orderId = insertOrder(adminId, insertProduct(adminId, "skip_ship"), orderNoPrefix + "skip_ship");

        ResponseEntity<Void> response = updateOrderAs(loginToken("admin"), orderId, "COMPLETED");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(orderStatus(orderId)).isEqualTo("PAID");
    }

    @Test
    void buyerCanCancelPaidOrderAndStockIsRestored() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(sellerId, "buyer_cancel");
        String buyerToken = loginToken("buyer");

        ResponseEntity<Map> purchased = purchaseAs(buyerToken, productId);
        assertThat(purchased.getStatusCode().value()).isEqualTo(200);
        assertThat(stockOf(productId)).isEqualTo(9);
        long orderId = orderIdOf(buyerId, productId);

        ResponseEntity<Void> cancelled = updateOrderAs(buyerToken, orderId, "CANCELLED");

        assertThat(cancelled.getStatusCode().value()).isEqualTo(200);
        assertThat(orderStatus(orderId)).isEqualTo("CANCELLED");
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void buyerCannotCancelShippedOrder() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long orderId = insertOrder(buyerId, insertProduct(sellerId, "buyer_cancel_shipped"), orderNoPrefix + "cancel_shipped", "SHIPPED");

        ResponseEntity<Void> response = updateOrderAs(loginToken("buyer"), orderId, "CANCELLED");

        // 同一个迁移对管理员合法、对买家越权，因此是 403 而不是 400
        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(orderStatus(orderId)).isEqualTo("SHIPPED");
    }

    @Test
    void repeatedPurchaseWithSameIdempotencyKeyCreatesSingleOrder() {
        long sellerId = ensureUser("seller", "INHERITOR", "INHERITOR");
        long buyerId = ensureUser("buyer", "NORMAL", "NORMAL_USER");
        long productId = insertProduct(sellerId, "idempotent");
        String buyerToken = loginToken("buyer");
        String key = scopePrefix + "idem-key";

        ResponseEntity<Map> first = purchaseAsWithKey(buyerToken, productId, key);
        ResponseEntity<Map> second = purchaseAsWithKey(buyerToken, productId, key);

        assertThat(first.getStatusCode().value()).isEqualTo(200);
        assertThat(second.getStatusCode().value()).isEqualTo(200);
        assertThat(second.getBody().get("reused")).isEqualTo(true);
        assertThat(stockOf(productId)).isEqualTo(9);
        assertThat(ordersWithKey(buyerId, key)).isEqualTo(1);
    }

    @SuppressWarnings("unchecked")
    @Test
    void orderPageSizeIsCappedAndDirectionFilterWorks() {
        long inheritorId = ensureUser("inheritor", "INHERITOR", "INHERITOR");
        long otherId = ensureUser("other", "NORMAL", "NORMAL_USER");
        long inheritedProduct = insertProduct(inheritorId, "direction_owned");
        long otherProduct = insertProduct(otherId, "direction_other");
        insertOrder(inheritorId, otherProduct, orderNoPrefix + "direction_purchase");
        insertOrder(otherId, inheritedProduct, orderNoPrefix + "direction_sale");
        String token = loginToken("inheritor");

        ResponseEntity<Map> buying = ordersAs(token, "?direction=BUYING&page=1&size=20");
        ResponseEntity<Map> selling = ordersAs(token, "?direction=SELLING&page=1&size=20");
        ResponseEntity<Map> oversized = ordersAs(token, "?direction=ALL&page=1&size=1000");
        ResponseEntity<Map> invalidDirection = ordersAs(token, "?direction=SIDEWAYS&page=1&size=20");

        assertThat(buying.getStatusCode().value()).isEqualTo(200);
        List<Map<String, Object>> buyingItems = (List<Map<String, Object>>) buying.getBody().get("items");
        assertThat(buyingItems).hasSize(1);
        assertThat(String.valueOf(buyingItems.get(0).get("orderNo"))).isEqualTo(orderNoPrefix + "direction_purchase");

        List<Map<String, Object>> sellingItems = (List<Map<String, Object>>) selling.getBody().get("items");
        assertThat(sellingItems).hasSize(1);
        assertThat(String.valueOf(sellingItems.get(0).get("orderNo"))).isEqualTo(orderNoPrefix + "direction_sale");

        assertThat(oversized.getStatusCode().value()).isEqualTo(200);
        assertThat(((Number) oversized.getBody().get("size")).intValue()).isEqualTo(100);
        Map<String, Object> summary = (Map<String, Object>) oversized.getBody().get("summary");
        assertThat(summary).containsKeys("PAID", "SHIPPED", "COMPLETED", "REFUNDED", "CANCELLED");

        assertThat(invalidDirection.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void adminCancelRestoresStock() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long productId = insertProduct(adminId, "cancel_stock", "APPROVED");
        jdbcTemplate.update("update creative_products set stock = 9 where id = ?", productId);
        long orderId = insertOrder(adminId, productId, orderNoPrefix + "cancel_stock");

        ResponseEntity<Void> response = updateOrderAs(loginToken("admin"), orderId, "CANCELLED");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(orderStatus(orderId)).isEqualTo("CANCELLED");
        assertThat(stockOf(productId)).isEqualTo(10);
    }

    @Test
    void superAdminCanPersistStatusForOrderWithNullJsonBody() {
        long adminId = ensureUser("admin", "SUPER_ADMIN", "SUPER_ADMIN");
        long orderId = insertOrderWithNullBody(adminId, insertProduct(adminId, "null_json"));

        ResponseEntity<Void> response = updateOrderAs(loginToken("admin"), orderId, "SHIPPED");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(orderStatus(orderId)).isEqualTo("SHIPPED");
    }

    private ResponseEntity<Map> purchaseAsWithKey(String token, long productId, String idempotencyKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Idempotency-Key", idempotencyKey);
        Map<String, Object> body = Map.of(
            "quantity", 1,
            "address", "test address",
            "contactName", "buyer",
            "contactPhone", "13800000000"
        );
        return restTemplate.exchange(
            url("/api/products/" + productId + "/purchase"),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private long orderIdOf(long buyerId, long productId) {
        Long orderId = jdbcTemplate.queryForObject(
            "select max(id) from operation_logs where operator_id = ? and resource_id = ? and operation = 'PRODUCT_PURCHASE'",
            Long.class,
            buyerId,
            productId
        );
        return orderId == null ? -1L : orderId;
    }

    private int ordersWithKey(long buyerId, String idempotencyKey) {
        Integer count = jdbcTemplate.queryForObject(
            """
            select count(*) from operation_logs
            where operator_id = ? and operation = 'PRODUCT_PURCHASE'
              and JSON_UNQUOTE(JSON_EXTRACT(request_body, '$.idempotencyKey')) = ?
            """,
            Integer.class,
            buyerId,
            idempotencyKey
        );
        return count == null ? 0 : count;
    }

    private ResponseEntity<Void> updateOrderAs(String token, long orderId, String status) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(
            url("/api/products/purchase-orders/" + orderId + "/status"),
            HttpMethod.PUT,
            new HttpEntity<>(Map.of("status", status), headers),
            Void.class
        );
    }

    private ResponseEntity<Void> updateOrderWithRawBody(String token, long orderId, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Content-Type", "application/json");
        return restTemplate.exchange(
            url("/api/products/purchase-orders/" + orderId + "/status"),
            HttpMethod.PUT,
            new HttpEntity<>(body, headers),
            Void.class
        );
    }

    private String orderStatus(long orderId) {
        return jdbcTemplate.queryForObject(
            "select JSON_UNQUOTE(JSON_EXTRACT(request_body, '$.status')) from operation_logs where id = ?", String.class, orderId
        );
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
