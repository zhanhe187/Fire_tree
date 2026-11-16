import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('main app delegates screen selection to vue-router', () => {
  const pkg = read('../package.json');
  const main = read('./main.ts');
  const app = read('./RootApp.vue');

  assert.match(pkg, /"vue-router"/);
  assert.match(main, /from ['"]\.\/router['"]/);
  assert.match(main, /\.use\(router\)/);
  assert.match(app, /<RouterView\s*\/>/);
});

test('router makes the portal the default entry and keeps admin routes addressable', () => {
  const router = read('./router/index.ts');
  const navigation = read('./admin/adminNavigation.ts');

  assert.match(router, /const\s+AdminShell\s*=\s*\(\)\s*=>\s*import\(['"]\.\.\/admin\/AdminApp\.vue['"]\)/);
  assert.match(router, /const\s+HeritageIntroApp\s*=\s*\(\)\s*=>\s*import\(['"]\.\.\/heritage-intro\/PortalHeritageEntry\.vue['"]\)/);
  assert.doesNotMatch(router, /import\s+AdminShell\s+from/);
  assert.doesNotMatch(router, /import\s+HeritageIntroApp\s+from/);
  assert.match(router, /path:\s*['"]\/['"]/);
  assert.match(router, /name:\s*['"]heritage-home['"]/);
  assert.match(router, /HeritageIntroApp/);
  assert.match(router, /name:\s*['"]heritage-explore['"]/);
  assert.match(router, /name:\s*['"]heritage-graph['"]/);
  assert.match(router, /name:\s*['"]heritage-community['"]/);
  assert.match(router, /name:\s*['"]heritage-articles['"]/);
  assert.match(router, /name:\s*['"]heritage-article-detail['"]/);
  assert.match(router, /name:\s*['"]heritage-exhibitions['"]/);
  assert.match(router, /name:\s*['"]heritage-exhibition-detail['"]/);
  assert.match(router, /name:\s*['"]heritage-favorites['"]/);
  assert.match(router, /name:\s*['"]admin-user-management['"]/);
  assert.match(router, /name:\s*['"]heritage-login['"]/);
  assert.doesNotMatch(router, /\.\.\/portal\//);
  assert.doesNotMatch(router, /\.\.\/views\//);
  assert.doesNotMatch(router, /HeritagePortalLayout/);
  assert.match(router, /path:\s*['"]\/admin['"]/);
  assert.match(router, /path:\s*['"]\/admin['"][\s\S]+component:\s*AdminShell/);
  assert.match(navigation, /['"]\/admin\/graph\/nodes['"]/);
  assert.match(navigation, /['"]\/admin\/review\/applications['"]/);
  assert.match(navigation, /['"]\/admin\/content\/governance['"]/);
  assert.match(navigation, /['"]\/admin\/content\/articles['"]/);
  assert.match(navigation, /['"]\/admin\/operations\/exhibitions['"]/);
  assert.match(router, /path:\s*['"]\/:pathMatch\(.*\)\*['"]/);
});

test('user-side route files live under the heritage-intro folder', () => {
  const router = read('./router/index.ts');
  const entry = read('./heritage-intro/PortalHeritageEntry.vue');
  const app = read('./heritage-intro/App.vue');

  assert.match(router, /import\(['"]\.\.\/heritage-intro\/PortalHeritageEntry\.vue['"]\)/);
  assert.match(router, /path:\s*['"]\/explore['"]/);
  assert.match(router, /path:\s*['"]\/graph['"]/);
  assert.match(router, /path:\s*['"]\/graph\/board['"]/);
  assert.match(router, /path:\s*['"]\/community['"]/);
  assert.match(router, /path:\s*['"]\/articles['"]/);
  assert.match(router, /path:\s*['"]\/articles\/:id['"]/);
  assert.match(router, /path:\s*['"]\/exhibitions['"]/);
  assert.match(router, /path:\s*['"]\/exhibitions\/:id['"]/);
  assert.match(router, /path:\s*['"]\/favorites['"]/);
  assert.match(router, /path:\s*['"]\/favorites\/space['"]/);
  assert.match(router, /path:\s*['"]\/favorites\/checkin['"]/);
  assert.match(entry, /from ['"]\.\/App\.vue['"]/);
  assert.match(entry, /from ['"]\.\/styles\.css\?raw['"]/);
  assert.match(entry, /data-heritage-intro-theme/);
  assert.match(entry, /<HeritageIntroApp\s*\/>/);
  assert.match(app, /import\(['"]\.\.\/features\/graph\/views\/portal\/GraphBoardPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/community\/views\/portal\/CommunityQaPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/article\/views\/portal\/ArticleListPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/article\/views\/portal\/ArticleDetailPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/exhibition\/views\/portal\/ExhibitionListPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/exhibition\/views\/portal\/ExhibitionDetailPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/favorite\/views\/portal\/LearningIndexPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/favorite\/views\/portal\/LearningStudyPage\.vue['"]\)/);
  assert.match(app, /import\(['"]\.\.\/features\/learning\/views\/portal\/LearningCheckinPage\.vue['"]\)/);
  assert.match(app, /key:\s*['"]graph['"][\s\S]*path:\s*['"]\/graph['"]/);
  assert.match(app, /key:\s*['"]favorites['"][\s\S]*path:\s*['"]\/favorites['"]/);
  assert.match(app, /v-if="route\.path\.startsWith\('\/graph\/board'\)" class="portal-function-section graph-function-section graph-direct-page"/);
  assert.ok(
    app.indexOf('v-if="route.path.startsWith(\'/graph/board\')"')
      < app.indexOf('class="page-hero projects-hero portal-feature-hero graph-scan-hero"'),
  );
  assert.match(app, /favorites-top-hero/);
  assert.doesNotMatch(app, /\/favorites\/space/);
  assert.match(app, /currentPath\.startsWith\('\/favorites\/study\/'\)/);
  assert.match(app, /goPath\('\/favorites\/checkin'\)/);
  assert.match(app, /class="portal-function-section favorites-function-section favorites-direct-page"/);
  assert.match(app, /label:\s*['"]首页['"]/);
  assert.match(app, /label:\s*['"]浏览['"]/);
  assert.match(app, /label:\s*['"]图谱['"]/);
  assert.match(app, /label:\s*['"]社区问答['"]/);
  assert.match(app, /label:\s*['"]收藏学习['"]/);
});

test('admin shell and admin pages live under the admin folder', () => {
  const router = read('./router/index.ts');
  const shell = read('./admin/AdminApp.vue');

  assert.match(router, /import\(['"]\.\.\/admin\/AdminApp\.vue['"]\)/);
  assert.match(shell, /defineAsyncComponent/);
  assert.match(shell, /import\(['"]\.\.\/features\/graph\/views\/admin\/GraphBoardPage\.vue['"]\)/);
  assert.match(shell, /from ['"]\.\/adminNavigation['"]/);
});

test('expensive portal visuals are loaded only when their page needs them', () => {
  const app = read('./heritage-intro/App.vue');

  assert.match(app, /defineAsyncComponent/);
  assert.match(app, /const\s+MagicRings\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/MagicRings\.vue['"]\)\)/);
  assert.match(app, /const\s+GridScan\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/GridScan\.vue['"]\)\)/);
  assert.match(app, /const\s+ImageTrail\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/ImageTrail\.vue['"]\)\)/);
  assert.doesNotMatch(app, /import\s+MagicRings\s+from/);
  assert.doesNotMatch(app, /import\s+GridScan\s+from/);
  assert.doesNotMatch(app, /import\s+ImageTrail\s+from/);
});

test('admin navigation is a shared configuration with page ownership and api contracts', () => {
  const navigation = read('./admin/adminNavigation.ts');

  assert.match(navigation, /export const pageMatrix/);
  assert.match(navigation, /audience:\s*['"]admin['"]/);
  assert.match(navigation, /audience:\s*['"]portal['"]/);
  assert.match(navigation, /api:\s*\[/);
  assert.match(navigation, /\/api\/graph\/nodes/);
  assert.match(navigation, /\/api\/community\/questions/);
  assert.match(navigation, /\/api\/content-governance\/sensitive-words/);
  assert.match(navigation, /\/api\/content-governance\/review-records/);
  assert.match(navigation, /\/api\/content-governance\/operation-logs/);
  assert.match(navigation, /\/api\/articles/);
  assert.match(navigation, /\/api\/exhibitions/);
  assert.match(navigation, /\/api\/analytics\/search-hot/);
  assert.match(navigation, /\/api\/analytics\/behavior-trend/);
  assert.match(navigation, /\/api\/analytics\/operation-audit/);
  assert.match(navigation, /adminNavigationGroups/);
});

test('admin navigation defines role helpers and keeps normal users out of backstage', () => {
  const navigation = read('./admin/adminNavigation.ts');
  const backstageNavigation = navigation.slice(0, navigation.indexOf('export const pageMatrix'));

  assert.match(navigation, /export function filterAdminNavigationItems/);
  assert.match(navigation, /export function filterAdminNavigationGroups/);
  assert.match(navigation, /export function canAccessAdminRoute/);
  assert.match(navigation, /export function firstAdminRouteForRoles/);
  assert.match(navigation, /NORMAL_USER_ROLE\s*=\s*['"]NORMAL_USER['"]/);

  assert.match(backstageNavigation, /route:\s*['"]\/admin\/graph\/nodes['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/graph\/edges['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/content\/media['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/graph\/board['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/review\/applications['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/content\/products['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/content\/articles['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/operations\/exhibitions['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"],\s*['"]INHERITOR['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/operations\/favorites['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/operations\/learning['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.match(backstageNavigation, /route:\s*['"]\/admin\/system\/users['"][\s\S]*roles:\s*\[\s*['"]SUPER_ADMIN['"]\s*\]/);
  assert.doesNotMatch(backstageNavigation, /roles:\s*\[[^\]]*['"]NORMAL['"][^\]]*\]/);
  assert.doesNotMatch(backstageNavigation, /roles:\s*\[[^\]]*['"]NORMAL_USER['"][^\]]*\]/);
});

test('article exhibition and audit APIs are exposed to frontend pages', () => {
  const api = [
    read('./features/article/services/article.ts'),
    read('./features/exhibition/services/exhibition.ts'),
    read('./features/analytics/services/analytics.ts'),
    read('./features/governance/services/governance.ts'),
  ].join('\n');
  const analytics = read('./features/analytics/views/admin/AnalyticsMapPage.vue');
  const articlePage = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibitionPage = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');

  assert.match(api, /export interface ArticleItem/);
  assert.match(api, /export interface ArticlePayload/);
  assert.match(api, /export interface ExhibitionItem/);
  assert.match(api, /export interface ExhibitionPayload/);
  assert.match(api, /export interface SearchHotItem/);
  assert.match(api, /export interface BehaviorTrendItem/);
  assert.match(api, /export interface OperationAuditItem/);
  assert.match(api, /export interface SensitiveWordItem/);
  assert.match(api, /export interface ContentReviewRecordItem/);
  assert.match(api, /export function fetchArticles/);
  assert.match(api, /export function publishArticle/);
  assert.match(api, /export function fetchExhibitions/);
  assert.match(api, /export function linkExhibitionNode/);
  assert.match(api, /export function fetchSearchHot/);
  assert.match(api, /export function fetchBehaviorTrend/);
  assert.match(api, /export function fetchOperationAudit/);
  assert.match(api, /export function fetchSensitiveWords/);
  assert.match(api, /export function createSensitiveWord/);
  assert.match(api, /export function fetchContentReviewRecords/);
  assert.match(api, /export function fetchContentGovernanceOperationLogs/);
  assert.match(articlePage, /publishArticle/);
  assert.match(articlePage, /offlineArticle/);
  assert.match(exhibitionPage, /linkExhibitionNode/);
  assert.match(exhibitionPage, /unlinkExhibitionNode/);
  assert.match(analytics, /fetchSearchHot/);
  assert.match(analytics, /fetchBehaviorTrend/);
  assert.match(analytics, /fetchOperationAudit/);
});

test('content governance is wired into the actual admin shell', () => {
  const router = read('./router/index.ts');
  const shell = read('./admin/AdminApp.vue');
  const navigation = read('./admin/adminNavigation.ts');
  const page = read('./features/governance/views/admin/ContentGovernancePage.vue');

  assert.match(navigation, /['"]\/admin\/content\/governance['"]/);
  assert.match(navigation, /key:\s*['"]governance['"]/);
  assert.match(navigation, /label:\s*['"]敏感词审核['"]/);
  assert.match(shell, /ContentGovernancePage/);
  assert.match(shell, /activeView === ['"]governance['"]/);
  assert.match(page, /createSensitiveWord/);
  assert.match(page, /fetchContentReviewRecords/);
  assert.match(page, /fetchContentGovernanceOperationLogs/);
});

test('sensitive word list is paginated on the server and exposes page controls', () => {
  const page = read('./features/governance/views/admin/ContentGovernancePage.vue');

  assert.match(page, /const wordPage = ref\(1\)/);
  assert.match(page, /const wordPageSize = \d+/);
  assert.match(page, /const wordPageCount = computed\(\(\) => Math\.max\(1, Math\.ceil\(wordTotal\.value \/ wordPageSize\)\)\)/);
  // 列表必须把当前页与每页条数交给后端，而不是永远请求第 1 页
  assert.match(page, /fetchSensitiveWords\(\{ keyword: wordKeyword\.value, page: wordPage\.value, size: wordPageSize \}\)/);
  assert.match(page, /function changeWordPage\(delta: number\)/);
  assert.match(page, /class="mini-pagination"/);
  assert.match(page, /@click="changeWordPage\(-1\)"/);
  assert.match(page, /@click="changeWordPage\(1\)"/);
  // 搜索应回到第 1 页，避免停留在越界页码
  assert.match(page, /function searchSensitiveWords\(\)[\s\S]*wordPage\.value = 1/);
});

test('content review records and governance operation logs are paginated too', () => {
  const page = read('./features/governance/views/admin/ContentGovernancePage.vue');

  for (const panel of [
    { name: 'review', total: 'reviewTotal', service: 'fetchContentReviewRecords' },
    { name: 'log', total: 'logTotal', service: 'fetchContentGovernanceOperationLogs' },
  ]) {
    const pageRef = `${panel.name}Page`;
    const sizeRef = `${panel.name}PageSize`;
    const countRef = `${panel.name}PageCount`;

    assert.match(page, new RegExp(`const ${pageRef} = ref\\(1\\)`));
    assert.match(page, new RegExp(`const ${sizeRef} = \\d+`));
    assert.match(page, new RegExp(`const ${countRef} = computed\\(\\(\\) => Math\\.max\\(1, Math\\.ceil\\(${panel.total}\\.value / ${sizeRef}\\)\\)\\)`));
    assert.match(page, new RegExp(`${panel.service}\\(\\{ keyword: \\w+\\.value, page: ${pageRef}\\.value, size: ${sizeRef} \\}\\)`));
    const pascal = panel.name === 'review' ? 'Review' : 'Log';
    assert.match(page, new RegExp(`function change${pascal}Page\\(delta: number\\)`));
    assert.match(page, new RegExp(`@click="change${pascal}Page\\(-1\\)"`));
    assert.match(page, new RegExp(`@click="change${pascal}Page\\(1\\)"`));
    assert.match(page, new RegExp(`v-if="${countRef} > 1"`));
  }

  // 三个面板的页码状态一致：筛选取第 1 页，越界时回落到最后一页
  assert.match(page, /function searchReviewRecords\(\)[\s\S]*reviewPage\.value = 1/);
  assert.match(page, /function searchOperationLogs\(\)[\s\S]*logPage\.value = 1/);
  assert.match(page, /if \(reviewPage\.value > reviewPageCount\.value\)/);
  assert.match(page, /if \(logPage\.value > logPageCount\.value\)/);
});

test('admin shell renders filtered navigation groups and redirects forbidden routes', () => {
  const shell = read('./admin/AdminApp.vue');
  const dashboardConfig = read('./admin/adminDashboardConfig.ts');

  assert.match(shell, /visibleAdminNavigationGroups/);
  assert.match(shell, /currentRoleCodes/);
  assert.match(shell, /isSuperAdmin/);
  assert.match(shell, /displayNavLabel/);
  assert.match(shell, /firstAdminRouteForRoles/);
  assert.match(shell, /canAccessAdminRoute/);
  assert.match(shell, /adminTopbarTitle/);
  assert.match(dashboardConfig, /项目申报工作台/);
  assert.match(shell, /item\.key === 'applications' && !isSuperAdmin/);
  assert.match(shell, /router\.replace\('\/'\)/);
  assert.match(shell, /v-for="group in visibleAdminNavigationGroups"/);
});

test('application page supports inheritor project submission without review actions', () => {
  const page = read('./features/application/views/admin/ApplicationReviewPage.vue');

  assert.match(page, /isSuperAdmin/);
  assert.match(page, /isApplicantMode/);
  assert.match(page, /formatApplicantError/);
  assert.match(page, /项目申报/);
  assert.match(page, /v-if="isSuperAdmin"/);
  assert.match(page, /v-if="!isApplicantMode"/);
  assert.match(page, /applicationType:\s*'PROJECT'/);
  assert.match(page, /function upsertApplicationRecord/);
  assert.match(page, /upsertApplicationRecord\(saved\)/);
});

test('shared ai assistant has an api client and is mounted in portal and admin shells', () => {
  const api = read('./features/ai/services/ai.ts');
  const assistant = read('./shared/components/AiFloatingAssistant.vue');
  const portal = read('./heritage-intro/App.vue');
  const admin = read('./admin/AdminApp.vue');

  assert.match(api, /export interface AiChatRequest/);
  assert.match(api, /export interface AiChatResponse/);
  assert.match(api, /export function sendAiChat/);
  assert.match(api, /\/api\/ai\/chat/);
  assert.match(assistant, /sendAiChat/);
  assert.match(assistant, /messages/);
  assert.match(assistant, /router\.push/);
  assert.match(assistant, /suggestions/);
  assert.match(assistant, /roleCodes/);
  assert.match(portal, /AiFloatingAssistant/);
  assert.match(portal, /audience="portal"/);
  assert.match(admin, /AiFloatingAssistant/);
  assert.match(admin, /audience="admin"/);
});
