import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('purchase modal owns readable colors instead of inheriting global theme text tokens', () => {
  const page = read('./features/product/views/portal/ProductDetailPage.vue');

  assert.match(page, /\.product-detail-page\s+\.purchase-modal\s*\{[\s\S]*--purchase-modal-ink:\s*#fff4df;/);
  assert.match(page, /\.purchase-modal\s+\.purchase-summary[\s\S]*color:\s*var\(--purchase-modal-ink\)/);
  assert.match(page, /\.purchase-modal\s+\.form-grid\s+label\s*>\s*span[\s\S]*color:\s*var\(--purchase-modal-muted\)/);
  assert.match(page, /\.purchase-modal\s+input::placeholder[\s\S]*color:\s*var\(--purchase-modal-placeholder\)/);
  assert.match(page, /\.purchase-modal\s+:is\(input,\s*button\):focus-visible[\s\S]*outline:/);
});

test('admin order page maps text and controls to dark and glass theme tokens', () => {
  const page = read('./features/product/views/admin/ProductOrderManagementPage.vue');

  assert.match(page, /--order-action-ink:\s*var\(--paper\)/);
  assert.match(page, /:global\(:root\[data-theme="glass"\]\)\s+\.order-management-page/);
  assert.match(page, /\.order-total-cell\s*\{[\s\S]*color:\s*var\(--order-total-ink\)/);
  assert.match(page, /\.order-time-cell\s*\{[\s\S]*color:\s*var\(--order-muted\)/);
  assert.match(page, /\.order-actions\s+button\s*\{[\s\S]*color:\s*var\(--order-action-ink\)/);
  assert.doesNotMatch(page, /\.order-actions\s+button\s*\{[\s\S]*?color:\s*#fff\s*;/);
});

test('router registers the admin order-management destination', () => {
  const router = read('./router/index.ts');
  const navigation = read('./admin/adminNavigation.ts');

  assert.match(router, /adminRoutePaths\.map/);
  assert.match(navigation, /['"]\/admin\/content\/product-orders['"]/);
});
