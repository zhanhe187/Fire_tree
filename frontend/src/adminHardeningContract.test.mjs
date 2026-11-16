import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('toggling account status must not wipe profile fields', () => {
  const page = read('./features/admin/views/admin/UserAccountManagementPage.vue');
  const toggle = page
    .match(/async function toggleUserStatus\(user: AdminUserItem\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(toggle.length > 0, 'toggleUserStatus should exist');
  // 后端 updateUser 对 real_name/phone/email 是直接赋值，只发 status 会把它们写成 NULL
  assert.match(toggle, /realName: user\.realName \?\? null/);
  assert.match(toggle, /phone: user\.phone \?\? null/);
  assert.match(toggle, /email: user\.email \?\? null/);
  assert.match(toggle, /status: nextStatus/);
});

test('node batch delete requires confirmation and tells the truth about edges', () => {
  const page = read('./features/graph/views/admin/NodeManagementPage.vue');

  assert.match(page, /const batchDeleteOpen = ref\(false\)/);
  assert.match(page, /function requestBatchDelete\(\)/);
  assert.match(page, /@click="requestBatchDelete"/);
  assert.match(page, /确认批量删除节点/);
  // 后端 deleteNode 会物理删除关系边，文案必须说明不可恢复
  assert.match(page, /关系边会被永久删除且无法恢复/);
  assert.doesNotMatch(page, /将逻辑删除「/);
});

test('order status feedback is not wiped by the reload', () => {
  const page = read('./features/product/views/admin/ProductOrderManagementPage.vue');
  const load = page.match(/async function load\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(load.length > 0, 'load should exist');
  assert.doesNotMatch(load, /successMessage\.value = ''/);
});

test('community post / answer / comment successes are visible', () => {
  const page = read('./features/community/views/portal/CommunityQaPage.vue');
  const selectQuestion = page
    .match(/async function selectQuestion\([\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(selectQuestion.length > 0, 'selectQuestion should exist');
  // 发帖/回答都是「先写提示再刷新详情」，selectQuestion 不能再清空提示
  assert.doesNotMatch(selectQuestion, /successMessage\.value = ''/);
  assert.match(page, /successMessage\.value = '问题已发布'/);
  assert.match(page, /successMessage\.value = '回答已发布'/);
  assert.match(page, /successMessage\.value = '评论已发布'/);
  assert.match(page, /function openQuestionDetail[\s\S]{0,120}successMessage\.value = ''/);
});

test('admin modals render errors inside the dialog', () => {
  const pages = [
    './features/admin/views/admin/UserAccountManagementPage.vue',
    './features/article/views/admin/ArticleManagementPage.vue',
    './features/media/views/admin/MediaArchivePage.vue',
    './features/exhibition/views/admin/ExhibitionManagementPage.vue',
  ];

  for (const path of pages) {
    const source = read(path);
    assert.match(source, /class="inline-error modal-inline-error"/, `${path} should render modal error`);
  }
});

test('link pickers never re-offer already linked targets', () => {
  const exhibition = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');
  const article = read('./features/article/views/admin/ArticleManagementPage.vue');
  const media = read('./features/media/views/admin/MediaArchivePage.vue');

  for (const source of [exhibition, article]) {
    assert.match(source, /const linkableProductOptions = computed\(/);
    assert.match(source, /<option v-for="product in linkableProductOptions"/);
  }
  assert.match(media, /const linkableNodeOptions = computed\(/);
  assert.match(media, /<option v-for="node in linkableNodeOptions"/);
});

test('checkin pages use local dates instead of UTC', () => {
  const helper = read('./shared/utils/localDate.ts');
  assert.match(helper, /export function formatLocalDate/);
  assert.match(helper, /export function shiftLocalMonth/);

  for (const path of [
    './features/learning/views/admin/LearningCheckinPage.vue',
    './features/learning/views/portal/LearningCheckinPage.vue',
  ]) {
    const source = read(path);
    assert.match(source, /from '\.\.\/\.\.\/\.\.\/\.\.\/shared\/utils\/localDate'/, `${path} should import helper`);
    assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/, `${path} must not derive today from UTC`);
  }
});

test('expired login shows a chinese relogin hint instead of raw english', () => {
  const http = read('./services/http.ts');
  assert.match(http, /response\.status === 401 && !path\.startsWith\('\/api\/auth\/'\)/);
  assert.match(http, /登录状态已失效，请重新登录/);

  const errors = read('./services/apiErrors.ts');
  assert.match(errors, /'Invalid bearer token'/);
  assert.match(errors, /'Missing bearer token'/);
  assert.match(errors, /'Bearer token expired'/);
});

test('backend hardening: risk report no-op and orphan order fallback', () => {
  const risk = read('../../backend/src/main/java/com/firetree/heritage/features/governance/mapper/RiskReportMapper.java');
  assert.match(risk, /Risk report is already resolved/);
  assert.match(risk, /HttpStatus\.CONFLICT, "Risk report is already resolved"/);

  const product = read('../../backend/src/main/java/com/firetree/heritage/features/product/mapper/ProductMapper.java');
  // 订单查询要能用下单快照兜底产品名/封面/卖家，避免产品删除后订单变孤儿
  assert.match(product, /coalesce\(p\.name,/);
  assert.match(product, /coalesce\(p\.owner_user_id,/);
  assert.match(product, /orderSnapshot\.put\("sellerId"/);
  assert.match(product, /orderSnapshot\.put\("sellerName"/);

  const learning = read('../../backend/src/main/java/com/firetree/heritage/features/learning/mapper/LearningMapper.java');
  assert.match(learning, /date\.isAfter\(LocalDate\.now\(\)\)/);
  assert.match(learning, /Checkin date cannot be in the future/);
});

test('cover upload re-save keeps the rest of the node payload', () => {
  const page = read('./features/graph/views/admin/NodeManagementPage.vue');
  const save = page.match(/async function saveNode\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.ok(save.length > 0, 'saveNode should exist');
  // 后端用 json_merge_patch 写 extra_attrs，只发封面字段会把 category/sourceName 等删掉
  assert.match(save, /\.\.\.payload,[\s\S]{0,120}coverImageUrl: result\.media\.previewUrl/);
});

test('favorite node picker dedupes against the full archive and skips private nodes', () => {
  const page = read('./features/favorite/views/admin/FavoriteGraphPage.vue');
  const ids = page.match(/const favoriteNodeIds = computed\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
  const optionsIndex = page.indexOf('const visibleOptions = computed(');
  const options = optionsIndex >= 0 ? page.slice(optionsIndex, optionsIndex + 260) : '';

  assert.ok(ids.length > 0, 'favoriteNodeIds should exist');
  // 只按当前页 3 条去重会让跨页已收藏节点反复出现在候选里
  assert.match(ids, /archiveSummary\.value\.items/);
  assert.ok(options.length > 0, 'visibleOptions should exist');
  assert.match(options, /node\.visibility === 'PUBLIC'/);
});

test('sensitive word deletion asks for confirmation and reports failures', () => {
  const page = read('./features/governance/views/admin/ContentGovernancePage.vue');

  assert.match(page, /const removeCandidate = ref<SensitiveWordItem \| null>\(null\)/);
  assert.match(page, /function requestRemoveWord\(/);
  assert.match(page, /async function confirmRemoveWord\(/);
  assert.match(page, /@click="requestRemoveWord\(item\)"/);
  assert.match(page, /确认删除敏感词/);
  assert.match(page, /不可恢复/);
  const confirm = page.match(/async function confirmRemoveWord\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(confirm, /catch \(err\)/);
  assert.match(confirm, /敏感词删除失败/);
});

test('edge dialog can search nodes and renders its own errors', () => {
  const page = read('./features/graph/views/admin/EdgeManagementPage.vue');

  // 253 个节点一次拉不完，端点下拉必须能在弹窗里搜索
  assert.match(page, /const nodeKeyword = ref\(''\)/);
  assert.match(page, /async function loadNodeOptions\(\)/);
  assert.match(page, /v-model="nodeKeyword"/);
  assert.match(page, /@click="loadNodeOptions"/);
  // 弹窗内要能看到失败原因
  assert.match(page, /class="inline-error modal-inline-error"/);
  // 后端 deleteEdge 是物理删除，文案不能再说"逻辑删除"
  assert.doesNotMatch(page, /将逻辑删除/);
  assert.match(page, /将永久删除/);
});

test('node detail view surfaces save errors and success', () => {
  const page = read('./features/graph/views/admin/NodeManagementPage.vue');
  const detailBlock = page.slice(
    page.indexOf('<template v-if="detailNodeId">'),
    page.indexOf('<template v-else'),
  );

  assert.ok(detailBlock.length > 0, 'detail block should exist');
  assert.match(detailBlock, /v-if="error"/, 'detail view should render error');
  assert.match(detailBlock, /v-if="successMessage"/, 'detail view should render success');
});

test('admin learner pickers use an account dropdown instead of free text', () => {
  const favorites = read('./features/favorite/views/admin/FavoriteGraphPage.vue');
  const checkin = read('./features/learning/views/admin/LearningCheckinPage.vue');

  for (const source of [favorites, checkin]) {
    assert.match(source, /fetchAdminUsers\(\{ status: 1, page: 1, size: 200 \}\)/);
    assert.match(source, /const accountOptions = ref<AdminUserItem\[\]>\(\[\]\)/);
    assert.match(source, /v-for="account in accountOptions"/);
    assert.match(source, /:value="account\.username"/);
  }
  assert.doesNotMatch(favorites, /placeholder="如：demo_learner"/);
  assert.doesNotMatch(checkin, /placeholder="如：demo_learner"/);
});

test('node pickers load enough candidates for the current dataset', () => {
  const pages = [
    './features/exhibition/views/admin/ExhibitionManagementPage.vue',
    './features/article/views/admin/ArticleManagementPage.vue',
    './features/product/views/admin/ProductReviewPage.vue',
    './features/community/views/portal/CommunityQaPage.vue',
    './features/favorite/views/admin/FavoriteGraphPage.vue',
    './features/media/views/admin/MediaArchivePage.vue',
    './features/application/views/admin/ApplicationReviewPage.vue',
    './features/media/views/portal/MaterialSubmitPage.vue',
  ];

  for (const path of pages) {
    const source = read(path);
    assert.match(source, /fetchGraphNodes\(\{[\s\S]{0,220}?size: 500/, `${path} should load 500 node candidates`);
  }
});

test('admin cannot disable their own account', () => {
  const page = read('./features/admin/views/admin/UserAccountManagementPage.vue');

  assert.match(page, /const currentUserId = computed\(/);
  assert.match(page, /不能停用或启用当前登录的账号/);
  const toggle = page.match(/async function toggleUserStatus\(user: AdminUserItem\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(toggle, /user\.id\) === currentUserId\.value/);
});

test('sensitive word severity is constrained in the form', () => {
  const page = read('./features/governance/views/admin/ContentGovernancePage.vue');

  assert.match(page, /敏感词级别只能是 1、2、3/);
  assert.match(page, /wordType\.trim\(\)\.toUpperCase\(\)/);
  assert.doesNotMatch(page, /v-model\.number="wordForm\.severity" type="number"/);
});

test('learner username errors are translated', () => {
  const errors = read('./services/apiErrors.ts');
  assert.match(errors, /'username is invalid'/);
  assert.match(errors, /'applicantUsername is invalid'/);
});
