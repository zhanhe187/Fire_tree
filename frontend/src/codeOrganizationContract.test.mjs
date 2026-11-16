import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('router derives standard admin paths from navigation metadata', () => {
  const router = read('./router/index.ts');
  const navigation = read('./admin/adminNavigation.ts');

  assert.match(navigation, /export const adminRoutePaths/);
  assert.match(router, /import \{ adminRoutePaths \} from ['"]\.\.\/admin\/adminNavigation['"]/);
  assert.match(router, /adminRoutePaths\.map/);
  assert.doesNotMatch(router, /const adminPaths\s*=\s*\[/);
});

test('API error handling and media URL normalization have separate modules', () => {
  const http = read('./services/http.ts');
  const apiErrors = read('./services/apiErrors.ts');
  const mediaUrl = read('./shared/utils/mediaUrl.ts');

  assert.match(http, /from ['"]\.\/apiErrors['"]/);
  assert.match(apiErrors, /export function friendlyApiError/);
  assert.match(apiErrors, /export function translateBackendMessage/);
  assert.match(apiErrors, /export const genericBackendErrorLabels/);
  assert.match(mediaUrl, /export function resolveMediaUrl/);
});

test('admin immutable presentation metadata lives outside AdminApp', () => {
  const app = read('./admin/AdminApp.vue');
  const config = read('./admin/adminDashboardConfig.ts');

  assert.match(config, /export const adminDashboardModules/);
  assert.match(config, /export const previewTypeDescriptions/);
  assert.match(config, /export function adminTopbarEyebrow/);
  assert.match(config, /export function adminTopbarTitle/);
  assert.doesNotMatch(app, /const modules\s*=\s*\[/);
  assert.doesNotMatch(app, /const previewTypeDescriptions/);
});
