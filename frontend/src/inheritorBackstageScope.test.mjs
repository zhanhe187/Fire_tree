import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('backstage-capable content APIs serialize the backstage flag and admin pages request scoped lists and details', () => {
  const product = read('./features/product/services/product.ts');
  const article = read('./features/article/services/article.ts');
  const exhibition = read('./features/exhibition/services/exhibition.ts');
  const productPage = read('./features/product/views/admin/ProductReviewPage.vue');
  const articlePage = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibitionPage = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');

  for (const source of [product, article, exhibition]) {
    assert.match(source, /backstage\?: boolean/);
    assert.match(source, /search\.set\('backstage', 'true'\)/);
    assert.match(source, /backstage\?: boolean/);
  }
  for (const source of [productPage, articlePage, exhibitionPage]) {
    assert.match(source, /backstage:\s*true/);
  }
  assert.match(productPage, /fetchProduct\(product\.id,\s*\{\s*backstage:\s*true\s*\}\)/);
  assert.match(articlePage, /fetchArticle\(article\.id,\s*\{\s*backstage:\s*true\s*\}\)/);
  assert.match(exhibitionPage, /fetchExhibition\(\w+\.id,\s*\{\s*backstage:\s*true\s*\}\)/);
});

test('product ownership editing is super-admin-only and inheritor payloads omit owner fields', () => {
  const page = read('./features/product/views/admin/ProductReviewPage.vue');

  assert.match(page, /const isSuperAdmin = computed\(/);
  assert.match(page, /v-if="isSuperAdmin"[\s\S]*form\.ownerUsername/);
  assert.match(page, /\.\.\.\(isSuperAdmin\.value \? \{[\s\S]*ownerUsername/);
});

test('order model and navigation distinguish seller responsibilities and grant order route access to inheritors', () => {
  const service = read('./features/product/services/product.ts');
  const navigation = read('./admin/adminNavigation.ts');

  assert.match(service, /sellerId:\s*number/);
  assert.match(service, /sellerUsername\?:\s*string/);
  assert.match(service, /sellerName\?:\s*string/);
  assert.match(service, /isBuyer\?:\s*boolean/);
  assert.match(service, /isSeller\?:\s*boolean/);
  assert.match(navigation, /route:\s*['"]\/admin\/content\/product-orders['"][\s\S]*roles:\s*\[['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\]/);
});

test('order pages limit status actions to the responsible buyer or seller and retain refunds for admins only', () => {
  const management = read('./features/product/views/admin/ProductOrderManagementPage.vue');
  const myOrders = read('./features/auth/views/MyOrdersPage.vue');

  assert.match(management, /const isSuperAdmin = computed\(/);
  assert.match(management, /v-if="order\.isSeller && order\.status === 'PAID'"/);
  assert.match(management, /v-if="order\.isBuyer && order\.status === 'SHIPPED'"/);
  assert.doesNotMatch(management, /isSuperAdmin \|\| \(order\.isSeller/);
  assert.doesNotMatch(management, /isSuperAdmin \|\| \(order\.isBuyer/);
  assert.match(management, /v-if="isSuperAdmin && !isTerminal\(order\.status\)"[\s\S]*REFUNDED/);
  assert.doesNotMatch(management, /查询全部用户的文创购买记录/);
  assert.match(myOrders, /updateProductOrderStatus/);
  assert.match(myOrders, /order\.isBuyer && order\.status === 'SHIPPED'/);
  assert.match(myOrders, /updateProductOrderStatus\(order\.id, 'COMPLETED'\)/);
});

test('order pages expose buyer self-cancel, direction filter and server-side status summary', () => {
  const management = read('./features/product/views/admin/ProductOrderManagementPage.vue');
  const myOrders = read('./features/auth/views/MyOrdersPage.vue');
  const profile = read('./features/auth/views/ProfilePage.vue');
  const service = read('./features/product/services/product.ts');
  const detail = read('./features/product/views/portal/ProductDetailPage.vue');

  // 买家自助取消未发货订单
  assert.match(myOrders, /cancelProductOrder/);
  assert.match(myOrders, /order\.isBuyer && order\.status === 'PAID'/);
  assert.match(myOrders, /confirm-modal confirm-modal-danger/);
  assert.match(service, /export function cancelProductOrder\(logId: number\)/);

  // 用户端只买入口径；后台可按方向/状态筛选
  assert.match(myOrders, /direction: 'BUYING'/);
  assert.match(profile, /direction: 'BUYING'/);
  assert.match(management, /direction:\s*filters\.direction/);
  assert.match(management, /status:\s*filters\.status \|\| undefined/);
  assert.match(service, /direction\?: ProductOrderDirection/);
  assert.match(service, /if \(params\.direction\) search\.set\('direction', params\.direction\)/);

  // 统计口径改为后端 summary，而不是只数当前页
  assert.match(management, /statusSummary/);
  assert.match(management, /response\.summary/);
  assert.doesNotMatch(management, /orders\.value\.filter\(\(o\) => o\.status === 'PAID'\)/);

  // 下单带幂等键，重复提交不会重复建单
  assert.match(detail, /purchaseIdempotencyKey/);
  assert.match(detail, /crypto\.randomUUID/);
  assert.match(service, /Idempotency-Key/);
});
