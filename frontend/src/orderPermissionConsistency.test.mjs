import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('personal orders page lets the backend scope orders by role (no buyerId)', () => {
  const page = read('./features/auth/views/MyOrdersPage.vue');

  assert.match(page, /fetchProductOrders\(\{/);
  assert.doesNotMatch(page, /buyerId\s*:\s*currentUser\.value\.id/);
  assert.match(page, /if \(!currentUser\.value\?\.id\)/);
  // 方向由后端翻译成"我买入的"，前端不传 buyerId 以免扩大范围
  assert.match(page, /direction: 'BUYING'/);
});

test('order status endpoint keeps a single source of truth for transitions', () => {
  const service = read('./features/product/services/product.ts');
  const http = read('./services/http.ts');

  assert.match(service, /\/api\/products\/purchase-orders\/\$\{logId\}\/status/);
  assert.match(service, /export function cancelProductOrder\(logId: number\)/);
  assert.match(service, /updateProductOrderStatus\(logId, 'CANCELLED'\)/);
  // 幂等键通过可选请求头下发，其余调用不受影响
  assert.match(http, /options: \{ headers\?: Record<string, string> \} = \{\}/);
  assert.match(http, /\.\.\.\(options\.headers \?\? \{\}\)/);
});

test('account menu hides the admin entry unless backstage access is granted', () => {
  const menu = read('./shared/components/AccountStaggeredMenu.vue');

  assert.match(menu, /backstageAccess\?: boolean/);
  assert.match(menu, /if \(props\.backstageAccess\)/);
  assert.match(menu, /action: 'admin'/);
});

test('portal shell derives backstage access from role codes and passes it down', () => {
  const app = read('./heritage-intro/App.vue');

  assert.match(app, /hasBackstageAccess = computed\(/);
  assert.match(app, /roleCode === 'SUPER_ADMIN'/);
  assert.match(app, /roleCode === 'INHERITOR'/);
  assert.match(app, /:backstage-access="hasBackstageAccess"/);
});

test('profile page order list comes from the server, never from shared local storage', () => {
  const profile = read('./features/auth/views/ProfilePage.vue');

  assert.match(profile, /fetchProductOrders\(/);
  assert.doesNotMatch(profile, /heritage-product-orders/);
  assert.doesNotMatch(profile, /localStorage\.getItem\('heritage-product-orders'\)/);
});

test('product detail page no longer writes orders into shared local storage', () => {
  const detail = read('./features/product/views/portal/ProductDetailPage.vue');

  assert.doesNotMatch(detail, /heritage-product-orders/);
  assert.doesNotMatch(detail, /localStorage\.setItem/);
});

test('orders page imports the global styles its background and layout depend on', () => {
  const page = read('./features/auth/views/MyOrdersPage.vue');

  assert.match(page, /import[^;]*portalDetail\.css/);
  assert.match(page, /import[^;]*portalDirectory\.css/);
});
