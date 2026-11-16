import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const productPage = () => read('./features/product/views/admin/ProductReviewPage.vue');

test('product admin separates offline (status change) from permanent delete', () => {
  const source = productPage();

  // 下架必须是改状态，产品记录保留在后台，之后还能重新上架
  assert.match(source, /async function togglePublish\(/);
  assert.match(source, /product\.status === 'APPROVED' \? 'OFFLINE' : 'APPROVED'/);
  assert.match(source, /await updateProduct\(product\.id, \{/);
  assert.match(source, /status: nextStatus/);

  // 删除仍走 DELETE，但必须与下架分开、并在弹窗里写清不可恢复
  assert.match(source, /async function performDeleteProduct\(/);
  assert.match(source, /await deleteProduct\(product\.id\)/);
  assert.match(source, /确认永久删除产品/);
  assert.match(source, /无法恢复/);

  // 行内操作同时出现"下架/上架"与"删除"两个按钮，不能再用删除冒充下架
  assert.match(source, /\{\{ product\.status === 'APPROVED' \? '下架' : '上架' \}\}/);
  assert.match(source, /title="永久删除（不可恢复）"/);
});

test('offline toggle keeps ownership so the product is not orphaned', () => {
  const source = productPage();
  const toggle = source
    .match(/async function togglePublish\(product: ProductItem\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(toggle.length > 0, 'togglePublish should exist');
  // 后端 updateProduct 会用请求里的 owner 覆盖 owner_user_id，漏传就会把归属清空
  assert.match(toggle, /ownerUsername: product\.ownerUsername \?\? null/);
  assert.match(toggle, /ownerUserId: product\.ownerUserId/);
});

test('product owner account is picked from a select backed by the user list', () => {
  const source = productPage();

  assert.match(source, /import \{ AdminUserItem, fetchAdminUsers \} from '\.\.\/\.\.\/\.\.\/admin\/services\/admin'/);
  assert.match(source, /async function loadAccountOptions\(/);
  assert.match(source, /fetchAdminUsers\(\{ status: 1, page: 1, size: 200 \}\)/);
  // 归属只认 sys_users.username，手填昵称会 400，因此改为下拉
  assert.match(source, /<span>归属账号<\/span>/);
  assert.match(source, /v-for="account in accountOptions"/);
  assert.match(source, /:value="account\.username"/);
  assert.doesNotMatch(source, /<input v-model\.trim="form\.ownerUsername"/);
});

test('product form validates lengths and non-negative numbers before submit', () => {
  const source = productPage();
  const validate = source
    .match(/function validateForm\(\): string \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(validate.length > 0, 'validateForm should exist');
  assert.match(validate, /name\.length > 128/);
  assert.match(validate, /4000/);
  assert.match(validate, /512/);
  assert.match(validate, /price < 0/);
  assert.match(validate, /stock < 0/);
  assert.match(source, /const validationError = validateForm\(\)/);
});

test('backend returns exception reasons so the UI can show them', () => {
  const handler = read('../../backend/src/main/java/com/firetree/heritage/config/ApiExceptionHandler.java');

  assert.match(handler, /@RestControllerAdvice/);
  assert.match(handler, /ResponseStatusException/);
  assert.match(handler, /MethodArgumentNotValidException/);
  assert.match(handler, /body\.put\("message", message\)/);
});

test('exhibition node link backfills a missing exhibition graph node instead of failing', () => {
  const mapper = read(
    '../../backend/src/main/java/com/firetree/heritage/features/exhibition/mapper/ExhibitionMapper.java'
  );
  const upsert = mapper
    .match(/private void upsertDisplayedAtEdge\([\s\S]*?\n    \}/)?.[0] ?? '';

  assert.ok(upsert.length > 0, 'upsertDisplayedAtEdge should exist');
  assert.match(upsert, /ensureExhibitionGraphNode\(exhibitionId, operatorId\)/);
  // 历史展览缺节点时必须补建，不能再抛 500
  assert.doesNotMatch(upsert, /INTERNAL_SERVER_ERROR, "Exhibition graph node is missing"/);
  assert.match(mapper, /private long ensureExhibitionGraphNode\(long exhibitionId, long operatorId\)/);
});

test('purchase success feedback survives the post-purchase reload', () => {
  const source = read('./features/product/views/portal/ProductDetailPage.vue');
  const submit = source
    .match(/async function submitPurchase\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const load = source
    .match(/async function loadProduct\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(submit.length > 0, 'submitPurchase should exist');
  assert.ok(load.length > 0, 'loadProduct should exist');
  // loadProduct 之前会清空 successMessage，把刚写入的成功提示擦掉
  assert.doesNotMatch(load, /successMessage\.value = ''/);
  assert.match(submit, /await loadProduct\(\)/);
  // 提示必须在刷新之后写入，否则仍会被覆盖
  const loadIndex = submit.indexOf('await loadProduct()');
  const successIndex = submit.indexOf('购买成功，订单已生成');
  assert.ok(loadIndex >= 0, 'reload should exist');
  assert.ok(successIndex > loadIndex, 'success feedback must be written after reload');
});

test('own products cannot be purchased from the portal', () => {
  const source = read('./features/product/views/portal/ProductDetailPage.vue');

  assert.match(source, /const isOwnProduct = computed\(/);
  assert.match(source, /Number\(ownerId\) === Number\(userId\)/);
  assert.match(source, /:disabled="purchasing \|\| isOwnProduct \|\| \(product\.stock \?\? 0\) <= 0"/);
  assert.match(source, /这是你上架的文创/);
  assert.match(source, /不能购买自己上架的文创/);
});

test('purchase failure messages are translated', () => {
  const errors = read('./services/apiErrors.ts');

  assert.match(errors, /'Sellers cannot purchase their own product'/);
  assert.match(errors, /'Insufficient stock'/);
  assert.match(errors, /'Product is not available for purchase'/);
  assert.match(errors, /'Product price is not set'/);
});

test('exhibition node picker excludes linked nodes and exhibition self nodes', () => {
  const source = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');
  const linkable = source
    .match(/const linkableNodeOptions = computed\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';

  assert.ok(linkable.length > 0, 'linkableNodeOptions should exist');
  assert.match(linkable, /linkedNodeIds\.has\(node\.id\)/);
  // 展览自身的 exhibition_market 节点不能出现在候选里，否则会构成自环边
  assert.match(linkable, /node\.nodeTypeCode !== 'exhibition_market'/);
});

test('common backend messages are translated for the admin UI', () => {
  const errors = read('./services/apiErrors.ts');

  assert.match(errors, /'ownerUsername is invalid'/);
  assert.match(errors, /'relatedNodeId is invalid'/);
  assert.match(errors, /'status is invalid'/);
  assert.match(errors, /'coverFileId is invalid'/);
});
