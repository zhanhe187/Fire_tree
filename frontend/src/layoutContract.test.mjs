import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const extractCssBlock = (source, startPattern) => {
  const match = source.match(startPattern);
  if (!match || match.index === undefined) return '';
  const openBrace = source.indexOf('{', match.index);
  if (openBrace < 0) return '';
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(match.index, index + 1);
    }
  }
  return '';
};

const cssRuleBlocks = (source) => [...source.matchAll(/(?:^|})\s*([^{}]+\{[^{}]*\})/g)].map((match) => match[1]);

test('topbar consolidates account, login, status, and theme controls into personal settings', () => {
  const app = read('./admin/AdminApp.vue');
  const styles = read('./admin/styles.css');

  assert.match(app, /class="personal-settings"/);
  assert.match(app, /class="personal-settings-panel"/);
  assert.match(app, /aria-label="个人设置"/);
  assert.match(app, /aria-label="数据库状态/);
  assert.match(app, /aria-label="主题切换"/);
  assert.doesNotMatch(app, /<section v-if="!auth" class="auth-pill"/);
  assert.doesNotMatch(app, /personal-login/);
  assert.doesNotMatch(app, /demoAccounts/);
  assert.doesNotMatch(app, /loginDemo/);
  assert.doesNotMatch(app, /婕旂ず璐﹀彿/);
  assert.doesNotMatch(app, /<div class="system-pill-row"/);
  assert.match(styles, /\.personal-settings-panel/);
});

test('learning page paginates recommendation data and separates summary, filters, and content lanes', () => {
  const page = read('./features/learning/views/admin/LearningCheckinPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /recommendationPager/);
  assert.match(page, /pagedRecommendations/);
  assert.match(page, /learning-data-strip/);
  assert.match(page, /learning-lane/);
  assert.match(page, /recommendation-pagination/);
  assert.doesNotMatch(page, /recommendation\.value\?\.items\.slice\(0, 4\)/);
  assert.match(styles, /\.learning-data-strip/);
  assert.match(styles, /\.recommendation-pagination/);
});

test('favorite page uses page-sized results and a less crowded split workspace', () => {
  const page = read('./features/favorite/views/admin/FavoriteGraphPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /size: 3/);
  assert.match(page, /favorite-composer-panel/);
  assert.match(page, /favorite-visual-stack/);
  assert.match(page, /favorite-detail-grid/);
  assert.match(page, /aria-label="收藏列表分页"/);
  assert.match(styles, /\.favorite-visual-stack/);
  assert.match(styles, /\.favorite-detail-grid/);
});

test('application shell keeps pages scrollable instead of locking content to the viewport', () => {
  const styles = read('./admin/styles.css');
  const shellRule = styles.match(/\.shell\s*\{[^}]+\}/)?.[0] ?? '';
  const workspaceRule = styles.match(/\.workspace\s*\{[^}]+\}/)?.[0] ?? '';
  const analyticsWorkspaceRule = styles.match(/\.workspace:has\(\.analytics-page\)\s*\{[^}]+\}/)?.[0] ?? '';
  const compactPageRule = styles.match(/\.compact-page\s*\{[^}]+\}/)?.[0] ?? '';
  const constrainedPagesRule = styles.match(/\.risk-page,\s*\n\.graph-board-page\s*\{[^}]+\}/)?.[0] ?? '';
  const fixedHeightDeclaration = /(?:^|[;{\n]\s*)height:\s*(?:100vh|calc\(100vh)/;

  assert.match(shellRule, /min-height:\s*100vh/);
  assert.doesNotMatch(shellRule, fixedHeightDeclaration);
  assert.doesNotMatch(shellRule, /overflow:\s*hidden/);
  assert.match(workspaceRule, /min-height:\s*100vh/);
  assert.match(workspaceRule, /overflow-y:\s*auto/);
  assert.doesNotMatch(workspaceRule, /overflow:\s*hidden/);
  assert.doesNotMatch(analyticsWorkspaceRule, /overflow:\s*hidden/);
  assert.doesNotMatch(compactPageRule, fixedHeightDeclaration);
  assert.doesNotMatch(compactPageRule, /overflow:\s*hidden/);
  assert.doesNotMatch(constrainedPagesRule, fixedHeightDeclaration);
});

test('admin shell keeps desktop navigation visible and wide content constrained', () => {
  const styles = read('./admin/styles.css');
  const sidebarRule = styles.match(/\.sidebar\s*\{[^}]+\}/)?.[0] ?? '';
  const workspaceRule = styles.match(/\.workspace\s*\{[^}]+\}/)?.[0] ?? '';
  const tablePanelRule = styles.match(/\.table-panel\s*\{[^}]+\}/)?.[0] ?? '';
  const mediaWorkbenchRule = styles.match(/\.media-workbench\s*\{[^}]+\}/)?.[0] ?? '';
  const mediaLinkManagementRule = styles.match(/\.media-link-management\s*\{[^}]+\}/)?.[0] ?? '';
  const glassNavLabelRule = styles.match(/:root\[data-theme="glass"\]\s+\.nav-group-label\s*\{[^}]+\}/)?.[0] ?? '';
  const glassPersonalSettingsRule = styles.match(/:root\[data-theme="glass"\]\s+\.personal-settings-trigger,\s*\n:root\[data-theme="glass"\]\s+\.personal-settings-panel,\s*\n:root\[data-theme="glass"\]\s+\.personal-settings-panel\s+\.session-card\s*\{[^}]+\}/)?.[0] ?? '';

  assert.match(sidebarRule, /position:\s*sticky/);
  assert.match(sidebarRule, /top:\s*0/);
  assert.match(sidebarRule, /height:\s*100vh/);
  assert.match(workspaceRule, /max-width:\s*100%/);
  assert.match(tablePanelRule, /max-width:\s*100%/);
  assert.match(tablePanelRule, /min-width:\s*0/);
  assert.match(mediaWorkbenchRule, /grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(400px,\s*460px\)/);
  assert.match(mediaLinkManagementRule, /grid-template-columns:\s*1fr/);
  assert.match(glassNavLabelRule, /color:\s*#[0-9a-fA-F]{6}/);
  assert.match(glassPersonalSettingsRule, /background:/);
  assert.match(glassPersonalSettingsRule, /color:\s*#[0-9a-fA-F]{6}/);
});

test('admin media, node list, and graph board localize English data for Chinese display', () => {
  const mediaPage = read('./features/media/views/admin/MediaArchivePage.vue');
  const nodePage = read('./features/graph/views/admin/NodeManagementPage.vue');
  const graphBoardPage = read('./features/graph/views/admin/GraphBoardPage.vue');
  const portalGraphBoardPage = read('./features/graph/views/portal/GraphBoardPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(mediaPage, /localizedMediaText/);
  assert.match(mediaPage, /friendlyMediaName/);
  assert.match(mediaPage, /nodeDetailUrl/);
  assert.match(mediaPage, /查看节点详情/);
  assert.match(mediaPage, /查看详情/);
  assert.match(mediaPage, /visibilityLabels/);
  assert.match(mediaPage, /class="media-link-management"/);
  assert.match(mediaPage, /class="media-side-stack"/);
  assert.match(mediaPage, /class="media-technical-meta"/);
  assert.match(mediaPage, /昆曲/);
  assert.doesNotMatch(mediaPage, /originalName:\s*uploaded\.originalName/);
  assert.doesNotMatch(mediaPage, /<h3>{{ selectedFile\.originalName }}<\/h3>/);
  assert.doesNotMatch(mediaPage, /{{ selectedFile\.visibility }}/);
  assert.doesNotMatch(mediaPage, /{{ file\.linkedNodeNames \|\| '鏈寕鎺? }}/);
  assert.doesNotMatch(mediaPage, /{{ link\.nodeName }}/);
  assert.doesNotMatch(mediaPage, /{{ link\.caption }}/);
  assert.match(nodePage, /localizedNodeText/);
  assert.match(nodePage, /nodeRelatedMedia/);
  assert.match(nodePage, /节点已挂接资源/);
  assert.match(nodePage, /fetchGraphNode\(detailNodeId\.value,\s*\{\s*includeAllMedia:\s*true\s*\}\)/);
  assert.match(nodePage, /loadNodeMediaFiles/);
  assert.match(nodePage, /fetchGraphNodeMediaFiles/);
  assert.match(nodePage, /fetchMediaFiles/);
  assert.match(nodePage, /mediaFileToNodeMedia/);
  assert.match(nodePage, /node-mounted-media/);
  assert.match(nodePage, /node-mounted-media-grid/);
  assert.match(nodePage, /nodeMediaPreviewUrl/);
  assert.match(styles, /--node-media-panel-bg/);
  assert.match(styles, /:root\[data-theme="glass"\]\s+\.node-mounted-media/);
  assert.match(styles, /--node-media-title:\s*#241c16/);
  assert.match(nodePage, /昆曲/);
  assert.doesNotMatch(nodePage, /Kun Qu opera/);
  assert.doesNotMatch(nodePage, /<strong>{{ node\.name }}<\/strong>/);
  assert.doesNotMatch(nodePage, /<h3>{{ activeNode\.name }}<\/h3>/);
  assert.match(graphBoardPage, /localizedSemanticChainTitle/);
  assert.match(graphBoardPage, /项目传承链/);
  assert.doesNotMatch(graphBoardPage, /{{ chain\.title }}/);
  for (const source of [graphBoardPage, portalGraphBoardPage]) {
    assert.match(source, /graphAiSearch/);
    assert.doesNotMatch(source, /semanticSearch,/);
    assert.doesNotMatch(source, /semanticSearch\(/);
    assert.match(source, /AI 智能检索/);
    assert.match(source, /aiAnswer/);
    assert.match(source, /aiResults/);
    assert.match(source, /semanticSearched/);
    assert.match(source, /fallbackAiAnswer/);
    assert.match(source, /fallbackAiResults/);
    // The relation line on a result card must prefer the backend's direction-aware summary: the raw
    // edge label reads backwards on a person card ("拥有传承人" → the person appears to own one),
    // which is what shipped on the 「苗族赶秋有没有传承人」 results.
    assert.match(source, /v-if="result\.relationSummary"/);
    assert.doesNotMatch(source, /瑙ｆ瀽鏉ユ簮/);
    assert.doesNotMatch(source, /鐩爣绫诲瀷/);
    assert.doesNotMatch(source, /鍏崇郴璺緞/);
    assert.doesNotMatch(source, /aiPlanParser/);
  }
});

test('heritage detail display prefers admin-edited fields over bundled patches', () => {
  const display = read('./heritage-intro/heritageDisplay.ts');
  const detailPage = read('./features/graph/views/portal/HeritageDetailPage.vue');
  const nodePage = read('./features/graph/views/admin/NodeManagementPage.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.match(display, /const adminSummary = item\.summary/);
  assert.match(display, /const summary = adminSummary \|\| patch\?\.summary/);
  assert.match(display, /const content = adminContent \|\| adminSummary \|\| patch\?\.summary/);
  assert.match(display, /const realImageUrl = normalizeImageUrl\(item\.coverImageUrl\) \|\| normalizeImageUrl\(patch\?\.image\)/);
  assert.match(display, /item\.coverImageCaption \|\| patch\?\.caption/);
  assert.match(detailPage, /class="heritage-detail-image-stage"/);
  assert.match(detailPage, /class="heritage-detail-admin-note"/);
  assert.match(styles, /\.heritage-detail-image-stage/);
  assert.match(styles, /\.heritage-detail-admin-note/);
  assert.match(nodePage, /class="form-section-title"/);
  assert.match(nodePage, /前台详情展示/);
  assert.match(nodePage, /管理员可在这里修改用户端详情页展示的图片、摘要、正文和地区等级信息。/);
});

test('heritage detail shows node-mounted media as related materials', () => {
  const api = read('./features/graph/services/graph.ts');
  const detailPage = read('./features/graph/views/portal/HeritageDetailPage.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.match(api, /export interface GraphNodeMediaItem/);
  assert.match(api, /mediaFiles\?:\s*GraphNodeMediaItem\[\]/);
  assert.match(api, /includeAllMedia\?:\s*boolean/);
  assert.match(api, /includeAllMedia/);
  assert.match(api, /fetchGraphNodeMediaFiles/);
  assert.match(detailPage, /relatedMediaFiles/);
  assert.match(detailPage, /loadRelatedMediaFiles/);
  assert.match(detailPage, /fetchGraphNodeMediaFiles/);
  assert.match(detailPage, /fetchMediaFiles/);
  assert.match(detailPage, /mediaPreviewUrl/);
  assert.match(detailPage, /isImageMedia/);
  assert.match(detailPage, /class="heritage-related-media"/);
  assert.match(detailPage, /相关资料/);
  assert.match(detailPage, /挂接到该节点的多媒体档案/);
  assert.match(detailPage, /<img v-if="isImageMedia\(media\) && mediaPreviewUrl\(media\)"/);
  assert.match(detailPage, /<audio v-else-if="media\.fileType === 'AUDIO' && mediaPreviewUrl\(media\)"/);
  assert.match(detailPage, /<video v-else-if="media\.fileType === 'VIDEO' && mediaPreviewUrl\(media\)"/);
  assert.match(detailPage, /:href="mediaPreviewUrl\(media\)"/);
  assert.match(styles, /\.heritage-related-media/);
  assert.match(styles, /\.heritage-media-loading/);
  assert.match(styles, /\.heritage-media-grid/);
  assert.match(styles, /\.heritage-media-card/);
});

test('admin node management uploads cover images and opens details as a standalone page', () => {
  const nodePage = read('./features/graph/views/admin/NodeManagementPage.vue');
  const router = read('./router/index.ts');
  const styles = read('./admin/styles.css');

  assert.match(nodePage, /type="file"/);
  assert.match(nodePage, /accept="image\/\*"/);
  assert.match(nodePage, /handleCoverFileChange/);
  assert.match(nodePage, /submitImageMaterial/);
  assert.match(nodePage, /router\.push\(`\/admin\/graph\/nodes\/\$\{node\.id\}`\)/);
  assert.doesNotMatch(nodePage, /drawerOpen/);
  assert.doesNotMatch(nodePage, /class="detail-drawer"/);
  assert.match(router, /\/admin\/graph\/nodes\/:nodeId/);
  assert.match(styles, /\.node-detail-page/);
  assert.match(styles, /\.cover-upload-control/);
});

test('admin pages use authenticated GET requests and friendly permission errors', () => {
  const api = read('./services/http.ts');
  const applicationPage = read('./features/application/views/admin/ApplicationReviewPage.vue');
  const analyticsPage = read('./features/analytics/views/admin/AnalyticsMapPage.vue');

  assert.match(api, /const token = getAuthToken\(\);[\s\S]+Authorization: `Bearer \$\{token\}`/);
  assert.match(api, /friendlyApiError/);
  assert.doesNotMatch(api, /throw new Error\(`\$\{path\} returned \$\{response\.status\}`\)/);
  assert.match(applicationPage, /formatAdminError/);
  assert.match(analyticsPage, /formatAdminError/);
  assert.doesNotMatch(applicationPage, /err instanceof Error \? err\.message : '鐢虫姤鍒楄〃鍔犺浇澶辫触'/);
  assert.doesNotMatch(analyticsPage, /err instanceof Error \? err\.message : '澶у睆鑱氬悎鏁版嵁鍔犺浇澶辫触'/);
});

test('api layer surfaces backend validation messages for admin forms', () => {
  const api = [
    read('./services/http.ts'),
    read('./services/apiErrors.ts'),
  ].join('\n');

  assert.match(api, /responseError/);
  assert.match(api, /genericBackendErrorLabels/);
  assert.match(api, /path\.startsWith\('\/api\/community\/'\)/);
  assert.match(api, /内容包含敏感词/);
  assert.match(api, /Content contains sensitive words/);
  assert.match(api, /内容涉及敏感信息/);
  assert.match(api, /Node code already exists/);
  assert.match(api, /节点编码已存在/);
  assert.match(api, /Media object already exists/);
  assert.match(api, /媒体文件已存在/);
  assert.match(api, /throw await responseError\(response, path\)/);
});

test('floating ai entry uses ikun frame sequence animation at the annotated size', () => {
  const assistant = read('./shared/components/AiFloatingAssistant.vue');

  assert.match(assistant, /AI_ENTRY_FRAME_COUNT\s*=\s*78/);
  assert.match(assistant, /\/ikun\/matte_\$\{String\(index \+ 1\)\.padStart\(5, '0'\)\}\.png/);
  assert.match(assistant, /requestAnimationFrame\(advanceAiEntryFrame\)/);
  assert.match(assistant, /class="ai-assistant-frame"/);
  assert.match(assistant, /:src="aiEntryImageSource"/);
  assert.match(assistant, /draggableAiEntryStyle/);
  assert.match(assistant, /handleAiEntryPointerDown/);
  assert.match(assistant, /handleAiEntryPointerMove/);
  assert.match(assistant, /handleAiEntryPointerUp/);
  assert.match(assistant, /setPointerCapture/);
  assert.match(assistant, /--ai-entry-width:\s*124px/);
  assert.match(assistant, /--ai-entry-height:\s*168px/);
  assert.match(assistant, /bottom:\s*max\(28px,\s*env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(assistant, /<Bot v-else/);
  assert.doesNotMatch(assistant, /width:\s*58px;\s*\n\s*height:\s*58px/);
});

test('heritage intro home page uses the Vue Bits Radar component as its background effect', () => {
  const app = read('./heritage-intro/App.vue');
  const styles = read('./heritage-intro/styles.css');
  const radar = read('./heritage-intro/components/Radar.vue');

  assert.match(app, /const Radar = defineAsyncComponent\(\(\) => import\('\.\/components\/Radar\.vue'\)\)/);
  assert.match(app, /class="intro-radar-background"/);
  assert.match(app, /<Radar\s/);
  assert.match(app, /color="#f4b43f"/);
  assert.doesNotMatch(app, /hero-bg-lines/);
  assert.match(radar, /from 'ogl'/);
  assert.match(radar, /uSweepLobes/);
  assert.match(styles, /\.intro-radar-background/);
  assert.match(styles, /\.intro-radar-background canvas/);
});

test('heritage intro home page adds a Chinese video opening page above the existing hero', () => {
  const app = read('./heritage-intro/App.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.match(app, /class="heritage-opening"/);
  assert.match(app, /<video[\s\S]+class="video-bg"[\s\S]+autoplay[\s\S]+muted[\s\S]+loop[\s\S]+playsinline/);
  assert.match(app, /src="\/videos\/555\.mp4"/);
  assert.match(app, /<h1 data-title="非遗">非遗<\/h1>/);
  assert.match(app, /特别策划/);
  assert.match(app, /守护民间记忆/);
  assert.match(styles, /\.heritage-opening\s*\{/);
  assert.match(styles, /\.video-bg\s*\{[^}]+object-fit:\s*cover/);
  assert.match(styles, /\.opening-vignette/);
  assert.match(styles, /\.opening-bottom-fade/);
  assert.match(styles, /\.opening-event\s*\{[^}]+bottom:\s*clamp\(96px,\s*12vh,\s*132px\)/);
  assert.match(styles, /\.home-hero\s*\{[^}]+animation:\s*openingNextPageFade/);
  assert.match(styles, /animation-timeline:\s*view\(\)/);
  assert.match(styles, /@keyframes\s+openingNextPageFade/);
  assert.match(styles, /@keyframes\s+openingHeroIn/);
});

test('heritage intro explore page uses MagicRings as its animated background and scales down the hero image', () => {
  const magicRingsPath = new URL('./heritage-intro/components/MagicRings.vue', import.meta.url);
  const app = read('./heritage-intro/App.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.ok(existsSync(magicRingsPath), 'MagicRings component should exist');

  const magicRings = read('./heritage-intro/components/MagicRings.vue');

  assert.match(app, /const MagicRings = defineAsyncComponent\(\(\) => import\('\.\/components\/MagicRings\.vue'\)\)/);
  assert.match(app, /class="explore-magic-rings-background"/);
  assert.match(app, /<MagicRings\s+v-bind="exploreMagicRingsProps"\s*\/>/);
  assert.match(app, /const exploreMagicRingsProps = \{[\s\S]+color:\s*'#d83a2e'/);
  assert.match(app, /const exploreMagicRingsProps = \{[\s\S]+colorTwo:\s*'#1e9cff'/);
  assert.match(magicRings, /from 'three'/);
  assert.match(magicRings, /uRingGap/);
  assert.match(styles, /\.explore-magic-rings-background/);
  assert.match(styles, /\.explore-magic-rings-background canvas/);
  assert.match(styles, /\.compact-hero\s+\.page-hero-image\s*\{[^}]+width:\s*min\(38vw,\s*460px\)/);
  assert.match(styles, /@media \(max-width:\s*1120px\)\s*\{[\s\S]+\.compact-hero\s+\.page-hero-image\s*\{\s*width:\s*min\(86vw,\s*460px\);/);
}
);

test('article and exhibition portal pages use museum portal directory layouts', () => {
  const articlePage = read('./features/article/views/portal/ArticleListPage.vue');
  const exhibitionPage = read('./features/exhibition/views/portal/ExhibitionListPage.vue');
  const articleDetailPage = read('./features/article/views/portal/ArticleDetailPage.vue');
  const exhibitionDetailPage = read('./features/exhibition/views/portal/ExhibitionDetailPage.vue');
  const articleAdminPage = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibitionAdminPage = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');
  const api = [
    read('./features/media/services/media.ts'),
    read('./features/article/services/article.ts'),
    read('./features/exhibition/services/exhibition.ts'),
  ].join('\n');

  for (const page of [articlePage, exhibitionPage]) {
    assert.match(page, /class="portal-page content-directory-page/);
    assert.match(page, /class="directory-hero"/);
    assert.match(page, /class="directory-toolbar"/);
    assert.match(page, /class="[^"]*directory-card/);
    assert.match(page, /formatChinaDate/);
    assert.match(page, /portalDirectory\.css/);
    assert.doesNotMatch(page, /background:\s*radial-gradient/);
  }

  assert.match(articlePage, /class="article-cover"/);
  assert.match(articlePage, /coverUrl/);
  assert.match(articlePage, /articleCoverUrl/);
  assert.match(articlePage, /relatedNodeCoverUrl/);
  assert.match(articlePage, /继续阅读/);
  assert.match(exhibitionPage, /class="date-badge"/);
  assert.match(exhibitionPage, /formatDateBadge/);
  assert.match(exhibitionPage, /coverUrl/);
  assert.match(exhibitionPage, /exhibitionCoverUrl/);
  assert.match(exhibitionPage, /linkedNodeCoverUrl/);
  assert.match(exhibitionPage, /查看详情/);

  for (const page of [articleDetailPage, exhibitionDetailPage]) {
    assert.match(page, /class="portal-detail-page museum-detail-page"/);
    assert.match(page, /class="detail-meta-strip"/);
    assert.match(page, /class="detail-complete-section"/);
    assert.match(page, /portalDetail\.css/);
    assert.match(page, /renderMarkdown/);
  }

  for (const page of [articleAdminPage, exhibitionAdminPage]) {
    assert.match(page, /uploadMediaImage/);
    assert.match(page, /type="file"/);
    assert.match(page, /accept="image\/\*"/);
    assert.match(page, /cover-upload-control/);
    assert.match(page, /form\.coverFileId/);
  }

  assert.match(api, /export function uploadMediaImage/);
  assert.match(api, /coverUrl\?:\s*string/);
  assert.match(api, /relatedNodeCoverUrl\?:\s*string/);
  assert.match(api, /linkedNodeCoverUrl\?:\s*string/);
});

test('portal article and exhibition detail render full markdown content', () => {
  const renderer = read('./shared/utils/markdownRenderer.ts');
  const styles = read('./shared/styles/portalDetail.css');

  assert.match(renderer, /orderedList/);
  assert.match(renderer, /blockquote/);
  assert.match(renderer, /<img src="\$2" alt="\$1"/);
  assert.match(renderer, /<ol>/);
  assert.match(styles, /\.markdown-body/);
  assert.match(styles, /\.markdown-body blockquote/);
  assert.match(styles, /\.markdown-body img/);
});

test('admin article and exhibition pages isolate optional lookup failures from list loading', () => {
  const articlePage = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibitionPage = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');

  assert.match(articlePage, /nodeLoadWarning/);
  assert.match(articlePage, /loadNodes\(\)\.catch/);
  assert.doesNotMatch(articlePage, /Promise\.all\(\[load\(\), loadNodes\(\)\]\)/);
  assert.match(exhibitionPage, /nodeLoadWarning/);
  assert.match(exhibitionPage, /loadNodes\(\)\.catch/);
  assert.doesNotMatch(exhibitionPage, /Promise\.all\(\[load\(\), loadNodes\(\)\]\)/);
});

test('community qa exposes delete actions and admin can remove any thread', () => {
  const page = read('./features/community/views/admin/CommunityQaPage.vue');

  assert.match(page, /deleteCommunityQuestion/);
  assert.match(page, /canDeleteQuestion/);
  assert.match(page, /danger-action/);
});

test('risk report page supports real resolution decisions', () => {
  const page = read('./features/governance/views/admin/RiskReportPage.vue');

  assert.match(page, /resolveDecision/);
  assert.match(page, /resolutionNote/);
  assert.match(page, /decisionOptions/);
});

test('product management no longer requires manual product codes', () => {
  const page = read('./features/product/views/admin/ProductReviewPage.vue');

  assert.doesNotMatch(page, /v-model="form\.productCode"/);
  assert.doesNotMatch(page, /\{\{\s*product\.productCode\s*\}\}/);
  assert.doesNotMatch(page, /\{\{\s*selectedProduct\.productCode\s*\}\}/);
  assert.doesNotMatch(page, /产品编码/);
  assert.doesNotMatch(page, /浜у搧缂栫爜/);
});

test('products are available on the portal and reviews take identity from the auth token', () => {
  const adminPage = read('./features/product/views/admin/ProductReviewPage.vue');
  const portalPage = read('./features/product/views/portal/ProductListPage.vue');
  const portalDetailPage = read('./features/product/views/portal/ProductDetailPage.vue');
  const portalShell = read('./heritage-intro/App.vue');
  const router = read('./router/index.ts');
  const styles = read('./heritage-intro/styles.css');
  const api = read('./features/product/services/product.ts');

  assert.doesNotMatch(adminPage, /v-model\.trim="reviewForm\.username"/);
  assert.doesNotMatch(adminPage, /currentUser\.value\?\.username/);
  assert.match(adminPage, /createProductReview\(selectedProduct\.value\.id,\s*\{/);
  assert.match(adminPage, /uploadMediaImage/);
  assert.match(adminPage, /coverPreviewUrl/);
  assert.match(adminPage, /coverUploading/);
  assert.match(adminPage, /handleCoverFileChange/);
  assert.match(adminPage, /type="file"/);
  assert.match(adminPage, /accept="image\/\*"/);
  assert.match(adminPage, /form\.coverFileId/);
  assert.match(adminPage, /Markdown/);
  assert.match(adminPage, /renderMarkdown/);
  assert.match(portalPage, /product-hero-panel/);
  assert.match(portalPage, /product-filter-panel/);
  assert.match(portalPage, /fetchProducts/);
  assert.match(portalPage, /fetchMediaFile/);
  assert.match(portalPage, /useRouter/);
  assert.match(portalPage, /router\.push\(`\/products\/\$\{product\.id\}`\)/);
  assert.doesNotMatch(portalPage, /createProductReview/);
  assert.doesNotMatch(portalPage, /product-review-panel/);
  assert.match(portalPage, /renderMarkdown/);
  assert.match(portalPage, /resolveMediaUrl/);
  assert.match(portalPage, /coverUrl/);
  assert.match(portalPage, /product-card-cover/);
  assert.match(portalPage, /product-catalog-head/);
  assert.match(portalPage, /product-meta-grid/);
  assert.match(portalPage, /查看详情/);
  assert.match(portalDetailPage, /fetchProduct/);
  assert.match(portalDetailPage, /fetchMediaFile/);
  assert.match(portalDetailPage, /createProductReview/);
  assert.match(portalDetailPage, /authSession\.auth\?\.user\.username/);
  assert.match(portalDetailPage, /resolveMediaUrl/);
  assert.match(portalDetailPage, /product-detail-cover/);
  assert.match(portalDetailPage, /product-review-panel/);
  assert.match(portalDetailPage, /product-score-card/);
  assert.match(portalDetailPage, /product-score-cover/);
  assert.match(portalDetailPage, /v-html/);
  assert.match(portalDetailPage, /markdown-body/);
  assert.match(portalPage, /非遗文创评分/);
  assert.doesNotMatch(portalPage, /鏈|鍒|璇|鎼|绛|鐧|鍙|椤/);
  assert.doesNotMatch(portalDetailPage, /鏈|鍒|璇|鎼|绛|鐧|鍙|椤/);
  assert.match(portalShell, /ProductListPage/);
  assert.match(portalShell, /ProductDetailPage/);
  assert.match(portalShell, /route\.path\.startsWith\('\/products\/'\)/);
  assert.match(router, /\/products/);
  assert.match(router, /\/products\/:id/);
  assert.match(api, /coverUrl\?:\s*string/);
  assert.match(styles, /\.product-portal-page\s+\.product-hero-panel/);
  assert.match(styles, /\.product-filter-panel/);
  assert.match(styles, /\.product-review-panel/);
  assert.match(styles, /\.product-detail-cover/);
  assert.match(styles, /\.product-catalog-head/);
  assert.match(styles, /\.product-meta-grid/);
  assert.match(styles, /\.product-score-card/);
  assert.match(styles, /\.product-card-cover/);
  assert.match(styles, /\.product-score-cover/);
  assert.match(styles, /\.product-description-markdown/);
});

test('application review explains workflow steps instead of raw numbers', () => {
  const api = [
    read('./features/application/services/application.ts'),
    read('./services/apiErrors.ts'),
  ].join('\n');
  const page = read('./features/application/views/admin/ApplicationReviewPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /applicationStepOptions/);
  assert.match(page, /stepLabel/);
  assert.match(page, /openEdit/);
  assert.match(page, /performDeleteApplication/);
  assert.match(page, /modalMode/);
  assert.match(api, /updateApplication/);
  assert.match(api, /deleteApplication/);
  assert.match(api, /Method Not Allowed/);
  assert.match(api, /请求方式不正确/);
  assert.match(api, /if \(status === 405\)/);
  assert.match(page, /node-ingest-card/);
  assert.match(page, /查看节点详情/);
  assert.match(page, /\/admin\/graph\/nodes\/\$\{selectedApplication\.targetNodeId\}/);
  assert.match(page, /\{\{\s*stepLabel\(application\.currentStep\)\s*\}\}/);
  assert.match(page, /function parseApplicationFormData\(/);
  assert.match(page, /function formatApplicationFormValue\(/);
  assert.match(styles, /\.form-data-list\s+dd\s*\{[^}]*white-space:\s*pre-wrap/);
  assert.doesNotMatch(page, /<input v-model\.number="form\.currentStep" type="number"/);
});

test('application review loads all statuses before an explicit filter is chosen', () => {
  const page = read('./features/application/views/admin/ApplicationReviewPage.vue');

  assert.match(page, /status:\s*''/);
  assert.match(page, /filters\.status\s*=\s*''/);
  assert.match(page, /<option value="">全部状态<\/option>/);
  assert.doesNotMatch(page, /status:\s*'SUBMITTED'/);
  assert.doesNotMatch(page, /filters\.status\s*=\s*'SUBMITTED'/);
});

test('media archive upload saves the uploaded record and explains node mounting', () => {
  const page = read('./features/media/views/admin/MediaArchivePage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /uploadedFileId/);
  assert.match(page, /updateMediaFile\(uploadedFileId\.value, form\)/);
  assert.match(page, /挂接后的媒体会显示在对应节点/);
  assert.match(page, /用于把当前档案绑定到一个图谱节点/);
  assert.match(page, /class="node-detail-link"/);
  assert.match(page, /查看详情/);
  assert.match(styles, /\.node-detail-link/);
  const mediaWorkbenchRule = extractCssBlock(styles, /\.media-workbench\s*\{/);
  assert.match(mediaWorkbenchRule, /grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(400px,\s*460px\)/);
  assert.match(styles, /max-height:\s*calc\(100vh - 120px\)/);
});

test('media archive shows two-line card summaries and bounds the detail rail to 400-460px', () => {
  const page = read('./features/media/views/admin/MediaArchivePage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /class="media-card-list"/);
  assert.match(page, /class="media-card"/);
  assert.match(page, /class="media-card-association"/);
  assert.match(page, /class="media-card-summary"/);
  assert.match(page, /class="media-card-storage"/);
  // 该页面只有一处表格，卡片重构后不应残留任何表格标记
  assert.doesNotMatch(page, /<table/);

  const mediaWorkbenchRule = extractCssBlock(styles, /\.media-workbench\s*\{/);
  const compactQuery = extractCssBlock(styles, /@media\s*\(max-width:\s*1080px\)\s*\{/);
  const summaryMinWidthRule = styles.match(/\.media-card-main,[\s\S]*?\.media-card-storage\s*\{[^}]*min-width:\s*0/)?.[0] ?? '';
  // 摘要 strong/small 会有多条规则（display: block 与两行截断各一条），取真正做截断的那条
  const summaryClampRule = [...styles.matchAll(/\.media-card-summary\s+(?:strong|small)[^{]*\{[^}]*\}/g)]
    .map((match) => match[0])
    .find((blockText) => blockText.includes('-webkit-line-clamp')) ?? '';

  assert.match(mediaWorkbenchRule, /grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(400px,\s*460px\)/);
  // min-width: 0 由分组选择器统一给到卡片各列，[^{}]* 允许选择器列表
  assert.match(summaryMinWidthRule, /min-width:\s*0/);
  assert.match(summaryClampRule, /display:\s*-webkit-box/);
  assert.match(summaryClampRule, /-webkit-box-orient:\s*vertical/);
  assert.match(summaryClampRule, /-webkit-line-clamp:\s*2/);
  assert.match(compactQuery, /\.media-workbench\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('media archive keeps five-card pages wired to request and navigation state', () => {
  const page = read('./features/media/views/admin/MediaArchivePage.vue');

  assert.match(page, /const filters = reactive\(\{[\s\S]*?page:\s*1,[\s\S]*?size:\s*5,[\s\S]*?total:\s*0/);
  assert.match(page, /const pageCount = computed\(\(\) => Math\.max\(1, Math\.ceil\(filters\.total \/ filters\.size\)\)\);/);
  assert.match(page, /const response = await fetchMediaFiles\(filters\);/);
  assert.match(page, /function resetFilters\(\) \{[^}]*filters\.page = 1;[^}]*void load\(\);[^}]*\}/);
  assert.match(page, /function changePage\(delta: number\) \{[^}]*filters\.page = Math\.min\(pageCount\.value, Math\.max\(1, filters\.page \+ delta\)\);[^}]*void load\(\);[^}]*\}/);
  assert.match(page, /files\.value = response\.items;\s*filters\.total = response\.total;/);
});

test('admin can manage all user accounts and reset passwords', () => {
  const page = read('./features/admin/views/admin/UserAccountManagementPage.vue');
  const navigation = read('./admin/adminNavigation.ts');
  const api = read('./features/admin/services/admin.ts');

  assert.match(page, /fetchAdminUsers/);
  assert.match(page, /resetAdminUserPassword/);
  assert.match(page, /statusToggle/);
  assert.match(navigation, /admin-user-management/);
  assert.match(api, /fetchAdminUsers/);
  assert.match(api, /resetAdminUserPassword/);
});

test('analytics map uses province paths, hover interaction, and localized labels', () => {
  const page = read('./features/analytics/views/admin/AnalyticsMapPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /chinaProvincePaths/);
  assert.match(page, /hoveredProvince/);
  assert.match(page, /@pointerenter="hoveredProvince = province\.name"/);
  assert.match(page, /class="province-map-path"/);
  assert.match(page, /provinceHeatByName/);
  assert.match(page, /省份热力与传播轨迹/);
  assert.match(page, /搜索热词/);
  assert.match(page, /行为趋势/);
  assert.match(page, /操作审计/);
  assert.match(page, /localizeSearchType/);
  assert.match(page, /localizeBehaviorType/);
  assert.match(page, /localizeTargetType/);
  assert.match(page, /localizeCategoryName\(item\.typeCode, item\.typeName\)/);
  assert.match(page, /placedProvinceLabels/);
  assert.match(page, /placedHeatLabels/);
  assert.match(page, /boxesOverlap\(box, other\)/);
  assert.doesNotMatch(page, /\?\?\?/);
  assert.match(styles, /\.province-map-path:hover/);
  assert.match(styles, /\.heat-map-label/);
  assert.match(styles, /\.map-tooltip/);
});

test('node management can edit inheritor birth year for analytics age buckets', () => {
  const nodePage = read('./features/graph/views/admin/NodeManagementPage.vue');
  const api = read('./features/graph/services/graph.ts');

  assert.match(api, /birthYear\?:\s*number/);
  assert.match(nodePage, /isInheritorForm/);
  assert.match(nodePage, /form\.birthYear/);
  assert.match(nodePage, /出生年份/);
  assert.match(nodePage, /placeholder="1958"/);
});
test('learning checkin calendar colors checked days and uses signed in user id', () => {
  const adminPage = read('./features/learning/views/admin/LearningCheckinPage.vue');
  const portalPage = read('./features/learning/views/portal/LearningCheckinPage.vue');
  const portalShell = read('./heritage-intro/App.vue');

  for (const page of [adminPage, portalPage]) {
    assert.match(page, /is-checked/);
    assert.match(page, /checkedDaysText/);
    assert.doesNotMatch(page, /<small>\{\{\s*day\.checked\s*\?\s*'宸叉墦鍗?\s*:\s*'鏈墦鍗?\s*\}\}<\/small>/);
    assert.doesNotMatch(page, /<small>\{\{\s*day\.checked\s*\?\s*"宸叉墦鍗?\s*:\s*"鏈墦鍗?\s*\}\}<\/small>/);
  }
  assert.match(portalShell, /:current-user-id="authSession\.auth\?\.user\.id \?\? null"/);
});

test('learning index surfaces checkin metrics and the checkin page owns the calendar controls', () => {
  const indexPage = read('./features/favorite/views/portal/LearningIndexPage.vue');
  const checkinPage = read('./features/learning/views/portal/LearningCheckinPage.vue');
  const styles = read('./heritage-intro/styles.css');

  // Task 7 retarget: the retired portal/FavoriteGraphPage.vue hosted the daily
  // recommendation, the check-in calendar and the metrics strip in one workspace.
  // After the card-index refactor the index page keeps only the summary metrics,
  // while the recommendation, calendar and check-in action live on the dedicated
  // /favorites/checkin page. (The mojibake guard for the calendar's checked-day
  // label already covers both checkin pages in the test above, and the old
  // 'portal favorite wrapper' test was deleted with PortalFavoritesPage.vue.)
  assert.match(indexPage, /fetchLearningCheckins\(\{ userId, month: currentMonth \}\)/);
  assert.match(indexPage, /class="learn-metrics"/);
  assert.match(indexPage, /class="learn-ring"/);
  assert.match(indexPage, /checkedToday/);

  assert.match(checkinPage, /createLearningCheckin/);
  assert.match(checkinPage, /fetchDailyRecommendation/);
  assert.match(checkinPage, /fetchLearningCheckins/);
  assert.match(checkinPage, /class="learning-calendar consumer-calendar"/);
  assert.match(checkinPage, /checkedDaysText/);
  assert.match(checkinPage, /完成今日打卡/);

  assert.match(styles, /\.consumer-calendar/);
  assert.match(styles, /\.daily-recommend-card/);
  assert.match(styles, /\.checkin-calendar-card/);
});

test('graph board center entry expands into the active canvas view', () => {
  const styles = read('./heritage-intro/styles.css');
  const graphPage = read('./features/graph/views/portal/GraphBoardPage.vue');

  assert.match(graphPage, /const\s+canvasTransitionActive\s*=\s*ref\(false\)/);
  assert.match(graphPage, /const\s+canvasTransitionOrigin\s*=\s*reactive\(\{ x: '50%', y: '50%' \}\)/);
  assert.match(graphPage, /function startCanvasEntryTransition\(event: MouseEvent\)/);
  assert.match(graphPage, /class=\"graph-canvas-expansion\"/);
  assert.match(graphPage, /class=\"graph-canvas-expansion-preview\"/);
  assert.match(graphPage, /@click=\"startCanvasEntryTransition\"/);
  assert.doesNotMatch(graphPage, /class=\"graph-canvas-entry\" type=\"button\" @click=\"enterCanvas\"/);
  assert.match(graphPage, /class=\"filter-bar graph-board-filter\"/);
  assert.match(graphPage, /class=\"panel-collapse graph-filter-toggle\"/);
  assert.match(graphPage, /class=\"graph-side-panel\"/);
  assert.match(graphPage, /overflow-y:\s*auto/);
  assert.match(graphPage, /overflow-y:\s*scroll !important/);
  assert.match(graphPage, /\.graph-side-panel::-[\w-]+scrollbar-thumb/);
  assert.match(graphPage, /\.graph-side-panel\s*>\s*\.side-section\s*\{[^}]*flex:\s*0\s+0\s+auto/);
  assert.match(graphPage, /displayNodeTypeName\(/);
  assert.match(graphPage, /displayRelationLabel\(/);
  assert.match(graphPage, /function handleSidePanelWheel\(event: WheelEvent\)/);
  assert.match(graphPage, /class="graph-side-panel" @wheel\.prevent\.stop="handleSidePanelWheel"/);
  assert.match(styles, /\.graph-board-page\.canvas-transitioning/);
  assert.match(styles, /\.graph-canvas-expansion/);
  assert.match(styles, /--canvas-transition-x/);
  assert.match(styles, /--canvas-transition-y/);
  assert.match(styles, /@keyframes\s+graphCanvasExpand/);
  assert.match(styles, /@keyframes\s+graphCanvasReveal/);
});

test('favorites page no longer mounts the retired glb particle showcase', () => {
  const app = read('./heritage-intro/App.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.doesNotMatch(app, /favorites-particle/);
  assert.doesNotMatch(app, /ModelParticleField|GlitchText|heritageStackImages|Stack\.vue/);
  assert.doesNotMatch(app, /models\/26f35ffaa76153b1fa933f735e998bf2\.glb/);
  assert.doesNotMatch(app, /models\/a5216761ccbc9a7e898b822208998106\.glb/);

  // Step 5b: the orphan .favorites-particle-* rules (and the glitch-slogan rules that
  // only existed inside that showcase) were deleted together with the three orphan
  // components, so the stylesheet-level absence assertion is restored here.
  assert.doesNotMatch(styles, /\.favorites-particle/);
  assert.doesNotMatch(styles, /\.favorites-glitch-text/);

  // the home page keeps its remaining lazily-loaded visuals
  assert.match(app, /const\s+Radar\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/Radar\.vue['"]\)\)/);
  assert.match(app, /const\s+CardSwap\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/CardSwap\.vue['"]\)\)/);
  assert.match(app, /const\s+CircularGallery\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/CircularGallery\.vue['"]\)\)/);
  assert.match(app, /const\s+GridMotion\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/GridMotion\.vue['"]\)\)/);
  assert.match(app, /const\s+MagicRings\s*=\s*defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/components\/MagicRings\.vue['"]\)\)/);
  assert.match(app, /<CardSwap[\s\S]{0,200}:card-distance="60"/);
  assert.match(app, /<CircularGallery[\s\S]{0,200}:items="storyCardItems"/);
  assert.match(app, /<GridMotion :items="inheritanceMotionImages"/);
  assert.match(app, /<ImageTrail :items="communityTrailImages"/);
});

test('heritage intro explore page softens the hero-to-list transition and reveals scrolled content', () => {
  const styles = read('./heritage-intro/styles.css');
  const masonry = read('./heritage-intro/components/Masonry.vue');

  assert.match(styles, /\.compact-hero::after/);
  assert.match(styles, /\.regions-page-section\s*\{[\s\S]+margin-top:\s*-\d+px/);
  assert.match(styles, /@keyframes\s+browseContentRise/);
  assert.match(styles, /\.masonry-item\.is-in-view\s+\.masonry-card/);
  assert.match(masonry, /IntersectionObserver/);
  assert.match(masonry, /observeMasonryItems/);
});

test('scroll reveal animations replay when sections re-enter the viewport', () => {
  const scrollReveal = read('./heritage-intro/components/ScrollReveal.vue');

  assert.match(scrollReveal, /scrub:\s*true/);
  assert.doesNotMatch(scrollReveal, /once:\s*true/);
});

test('account side menu exposes a personal profile entry that routes to profile page', () => {
  const app = read('./heritage-intro/App.vue');
  const menu = read('./shared/components/AccountStaggeredMenu.vue');

  assert.match(menu, /label:\s*'个人信息'/);
  assert.match(menu, /action:\s*'profile'/);
  assert.match(menu, /<UserRound\s+v-if="item\.action === 'profile'"/);
  assert.match(app, /async function handleAccountMenuSelect\(action: 'profile' \| 'orders' \| 'favorites' \| 'admin' \| 'login' \| 'logout'\)/);
  assert.match(app, /profile:\s*'\/profile'/);
});

test('profile page uploads avatar image files instead of editing avatar url text', () => {
  const page = read('./features/auth/views/ProfilePage.vue');
  const api = read('./features/auth/services/auth.ts');

  assert.match(api, /export function uploadCurrentUserAvatar\(file: File\)/);
  assert.match(api, /\/api\/auth\/me\/avatar/);
  assert.match(page, /uploadCurrentUserAvatar/);
  assert.match(page, /handleAvatarFileChange/);
  assert.match(page, /type="file"/);
  assert.match(page, /accept="image\/\*"/);
  assert.match(page, /class="[^"]*avatar-upload-control/);
  assert.doesNotMatch(page, /头像地址/);
  assert.doesNotMatch(page, /type="url"/);
});

test('profile page mirrors supplied 3d music-center animation shell while preserving edits', () => {
  const page = read('./features/auth/views/ProfilePage.vue');

  assert.match(page, /class="profile-scene"/);
  assert.match(page, /class="profile-container-wrapper"/);
  assert.match(page, /class="visualizer-ring"/);
  assert.match(page, /v-for="bar in visualizerBars"/);
  assert.match(page, /class="elastic-progress"/);
  assert.match(page, /class="lyrics-shell billboard"/);
  assert.match(page, /class="right-song-menu"/);
  assert.match(page, /function renderSceneFrame/);
  assert.match(page, /function updateVisualizer/);
  assert.match(page, /function setSongMenu/);
  assert.match(page, /function updateMenuDepth/);
  assert.match(page, /function updateLyricDepth/);
  assert.match(page, /function saveProfile/);
  assert.match(page, /function handleAvatarFileChange/);
  assert.match(page, /function savePassword/);
  assert.match(page, /updateCurrentUserProfile/);
  assert.match(page, /uploadCurrentUserAvatar/);
  assert.match(page, /changeCurrentUserPassword/);
});

test('profile page uses Vue Bits Hyperspeed as the animated background', () => {
  const page = read('./features/auth/views/ProfilePage.vue');
  const hyperspeed = read('./shared/components/Hyperspeed.vue');

  assert.match(page, /import Hyperspeed from '\.\.\/\.\.\/\.\.\/shared\/components\/Hyperspeed\.vue'/);
  assert.match(page, /const profileHyperspeedOptions/);
  assert.match(page, /class="profile-hyperspeed-background"/);
  assert.match(page, /<Hyperspeed\s+:effect-options="profileHyperspeedOptions"\s*\/>/);
  assert.match(page, /\.profile-hyperspeed-background/);
  assert.doesNotMatch(page, /background:\s*radial-gradient\(circle at center,\s*#1a2a3a 0%,\s*#050505 100%\)/);
  assert.match(hyperspeed, /from 'three'/);
  assert.match(hyperspeed, /from 'postprocessing'/);
  assert.match(hyperspeed, /class App/);
  assert.match(hyperspeed, /class CarLights/);
  assert.match(hyperspeed, /class Road/);
  assert.match(hyperspeed, /turbulentDistortion/);
});

test('profile page loads real scrollable lyrics and keeps the song menu clean', () => {
  const page = read('./features/auth/views/ProfilePage.vue');

  assert.match(page, /function parseLrc/);
  assert.match(page, /function loadLyricsForSong/);
  assert.match(page, /music-api\.gdstudio\.xyz/);
  assert.match(page, /api\.allorigins\.win/);
  assert.match(page, /lyricPreviewing/);
  assert.match(page, /lyricPreviewTimer/);
  assert.match(page, /@wheel\.prevent="handleLyricWheel"/);
  assert.match(page, /scrollTop\s*\+=\s*event\.deltaY/);
  assert.doesNotMatch(page, /playlist-particle-bg/);
  assert.doesNotMatch(page, /particleCanvasRef/);
  assert.doesNotMatch(page, /function drawParticles/);
});

test('admin personal settings menu exposes profile entry in the top right dropdown', () => {
  const app = read('./admin/AdminApp.vue');
  const styles = read('./admin/styles.css');

  assert.match(app, /function openProfilePage\(\)/);
  assert.match(app, /router\.push\('\/profile'\)/);
  assert.match(app, /class="personal-profile-link"/);
  assert.match(app, /个人信息/);
  assert.match(app, /头像、联系方式与账号资料/);
  assert.match(styles, /\.personal-profile-link/);
});

test('login page centers a Vue Bits rotating heritage title over the custom background', () => {
  const page = read('./features/auth/views/AuthPage.vue');
  const styles = read('./heritage-intro/styles.css');
  const rotatingText = read('./shared/components/RotatingText.vue');

  assert.match(page, /import RotatingText from '\.\.\/\.\.\/\.\.\/shared\/components\/RotatingText\.vue'/);
  assert.match(page, /import loginBgUrl from '\.\.\/\.\.\/\.\.\/heritage-intro\/assets\/login\.png'/);
  assert.match(page, /projects:\s*\['皮影戏', '景泰蓝', '木版年画', '龙泉青瓷', '花鼓戏'\]/);
  assert.match(page, /<strong>{{ text\.heritage }}<\/strong>/);
  assert.match(page, /<RotatingText/);
  assert.match(page, /:texts="text\.projects"/);
  assert.match(styles, /background-image:\s*var\(--auth-bg\)/);
  assert.match(styles, /\.auth-rotating-headline/);
  assert.match(styles, /\.rotating-heritage-name/);
  assert.match(rotatingText, /from 'motion-v'/);
  assert.match(rotatingText, /export type StaggerFrom/);
});

test('login card uses glass styling and cursor-driven light interaction', () => {
  const page = read('./features/auth/views/AuthPage.vue');
  const styles = read('./heritage-intro/styles.css');

  assert.match(page, /const authCardStyle = reactive\(\{ '--card-x': '50%', '--card-y': '50%' \}\)/);
  assert.match(page, /function handleAuthCardPointerMove\(event: PointerEvent\)/);
  assert.match(page, /event\.currentTarget as HTMLElement/);
  assert.match(page, /authCardStyle\['--card-x'\] = `\$\{x\}%`/);
  assert.match(page, /@pointermove="handleAuthCardPointerMove"/);
  assert.match(page, /:style="authCardStyle"/);
  assert.match(styles, /\.auth-card::before/);
  assert.match(styles, /radial-gradient\(circle at var\(--card-x\) var\(--card-y\)/);
  assert.match(styles, /backdrop-filter:\s*blur\(28px\) saturate\(1\.45\)/);
  assert.match(styles, /\.auth-card:hover/);
  assert.match(styles, /\.auth-card input:focus/);
});

test('auth email verification requires users to read the code from their mailbox', () => {
  const page = read('./features/auth/views/AuthPage.vue');

  assert.match(page, /验证码已发送至/);
  assert.doesNotMatch(page, /response\.debugCode/);
  assert.doesNotMatch(page, /form\.emailCode\s*=\s*response\.debugCode/);
  assert.doesNotMatch(page, /auth-debug-code/);
  assert.doesNotMatch(page, /captcha\?\.debugCode/);
});

test('community qa banner uses StarBorder glass styling and entire thread rows open detail', () => {
  const page = read('./features/community/views/portal/CommunityQaPage.vue');
  const starBorder = read('./shared/components/StarBorder.vue');

  assert.match(page, /import StarBorder from '\.\.\/\.\.\/\.\.\/\.\.\/shared\/components\/StarBorder\.vue'/);
  assert.match(page, /<StarBorder[\s\S]+as="header"[\s\S]+custom-class="forum-banner tieba-bar-head"/);
  assert.match(page, /color="#fff7ed"/);
  assert.match(page, /speed="5s"/);
  assert.match(page, /class="forum-banner-glass"/);
  assert.match(page, /class="thread-row tieba-thread-row"[\s\S]+role="link"[\s\S]+tabindex="0"[\s\S]+@click="openQuestionDetail\(question\)"[\s\S]+@keydown\.enter\.prevent="openQuestionDetail\(question\)"/);
  assert.match(page, /class="thread-title"[\s\S]+@click\.stop="openQuestionDetail\(question\)"/);
  assert.match(page, /class="thread-thumb"[\s\S]+@click\.stop="openQuestionDetail\(question\)"/);
  assert.match(page, /\.forum-banner-glass\s*\{[\s\S]+backdrop-filter:\s*blur\(24px\)\s+saturate\(1\.35\)/);
  assert.match(starBorder, /animate-star-movement-bottom/);
  assert.match(starBorder, /@keyframes\s+star-movement-top/);
});

test('community qa image cache survives auth timing and account key changes', () => {
  const page = read('./features/community/views/portal/CommunityQaPage.vue');
  const api = read('./features/community/services/community.ts');

  assert.match(api, /imageUrl\?:\s*string/);
  assert.match(page, /const\s+QUESTION_IMAGE_STORAGE_PREFIX\s*=\s*['"]heritage-community-images-['"]/);
  assert.match(page, /function\s+readQuestionImageStore/);
  assert.match(page, /Object\.keys\(window\.localStorage\)/);
  assert.match(page, /key\.startsWith\(QUESTION_IMAGE_STORAGE_PREFIX\)/);
  assert.match(page, /if\s*\(typeof question !== 'number' && question\.imageUrl\)/);
  assert.match(page, /imageUrl:\s*questionImagePreview\.value \|\| undefined/);
  assert.match(page, /v-if="questionImage\(question\)"/);
  assert.match(page, /:src="questionImage\(question\)"/);
  assert.match(page, /syncQuestionImages\(\);/);
  assert.match(page, /persistQuestionImages\(\);/);
});

test('product, exhibition, and community workspaces balance list, detail rail, and review area', () => {
  const styles = read('./admin/styles.css');
  const page = read('./features/product/views/admin/ProductReviewPage.vue');
  const block = (selector) => styles.match(new RegExp(`${selector}\\s*\\{[^}]+\\}`))?.[0] ?? '';

  const productWorkbench = block('\\.product-workbench');
  const productMainColumn = block('\\.product-main-column');
  const productReviewBlock = block('\\.product-review-block');
  const productDetailPanel = block('\\.product-detail-panel');

  // 左列 = 表格 + 评价区纵向堆叠；右栏只放详情，吸顶且不自带滚动条
  assert.match(productWorkbench, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(320px,\s*400px\)/);
  assert.match(productWorkbench, /align-items:\s*start/);
  assert.match(productMainColumn, /display:\s*grid/);
  assert.match(productReviewBlock, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(320px,\s*1fr\)\)/);
  assert.match(productDetailPanel, /position:\s*sticky/);
  assert.match(productDetailPanel, /align-self:\s*start/);
  assert.doesNotMatch(productDetailPanel, /max-height/);
  assert.doesNotMatch(productDetailPanel, /overflow-y/);

  // 评价表单 / 评价列表搬到了左列（否则右栏 1.4 个视口高必然被裁）
  assert.match(page, /class="product-main-column"/);
  assert.match(page, /class="product-review-block"/);
  assert.ok(
    page.indexOf('class="product-review-block"') < page.indexOf('class="product-detail-panel"'),
    '评价区应排在表格下方、详情栏之前',
  );

  const exhibitionWorkbench = block('\\.exhibition-workbench');
  const exhibitionTablePanel = block('\\.exhibition-workbench > \\.table-panel');
  const exhibitionDetailPanel = block('\\.exhibition-workbench > \\.media-preview-panel');
  const exhibitionLinkPanel = block('\\.exhibition-workbench > \\.exhibition-link-panel');

  // 此前 .exhibition-workbench 完全没有样式：详情卡被压成 190px 宽并留下整片空白
  assert.match(exhibitionWorkbench, /display:\s*grid/);
  assert.match(exhibitionWorkbench, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(320px,\s*380px\)/);
  assert.match(exhibitionWorkbench, /align-items:\s*stretch/);
  assert.match(exhibitionTablePanel, /flex-direction:\s*column/);
  assert.match(exhibitionDetailPanel, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(exhibitionDetailPanel, /position:\s*sticky/);
  assert.match(exhibitionDetailPanel, /align-self:\s*start/);
  assert.doesNotMatch(exhibitionDetailPanel, /overflow-y/);
  assert.match(exhibitionLinkPanel, /grid-column:\s*1 \/ -1/);

  // 挂接面板不再把表单控件拉到整屏宽
  const linkPanelBody = block('\\.link-panel-body');
  assert.match(linkPanelBody, /display:\s*grid/);
  assert.match(linkPanelBody, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(280px,\s*1fr\)\)/);
  assert.match(styles, /\.article-link-panel > header/);
  assert.match(styles, /\.exhibition-link-panel > header/);
});

test('community detail panel keeps a single full-width column and survives long posts', () => {
  const styles = read('./admin/styles.css');
  const page = read('./features/community/views/admin/CommunityQaPage.vue');
  const block = (selector) => styles.match(new RegExp(`${selector}\\s*\\{[^}]+\\}`))?.[0] ?? '';

  const detailPanel = block('\\.community-detail-panel');
  const compose = block('\\.community-compose');
  const likeCard = block('\\.community-like-card');
  const titleRow = block('\\.detail-title-row');
  const threadActions = block('\\.community-thread-actions span,\\s*\\n\\.community-thread-actions small');
  const chainEmpty = block('\\.chain-empty');

  // 详情栏必须是单列：此前的 repeat(2, ...) 会把卡片压到 199px 宽并把行拉成 900px
  assert.match(detailPanel, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(styles, /\.community-detail-panel\s*\{[^}]*repeat\(2/);
  assert.match(detailPanel, /align-content:\s*start/);
  // 吸顶但不自带滚动条：栏底卡片保持完整可见
  assert.match(detailPanel, /position:\s*sticky/);
  assert.match(detailPanel, /align-self:\s*start/);
  assert.doesNotMatch(detailPanel, /max-height/);
  assert.doesNotMatch(detailPanel, /overflow-y/);
  // 卡片内部行不再被拉伸摊开
  assert.match(compose, /align-content:\s*start/);
  assert.match(styles, /\.community-compose > \.primary-action,\s*\n\.community-compose > \.secondary-action\s*\{[^}]+width:\s*100%/);
  // 点赞按钮保持实际尺寸并与标题同行
  assert.match(likeCard, /display:\s*flex/);
  assert.match(likeCard, /justify-content:\s*space-between/);
  assert.match(page, /class="side-section community-compose community-like-card"/);
  // 删除图标按钮与同行标签胶囊等高
  assert.match(styles, /\.community-thread-actions \.icon-only\s*\{[^}]+min-height:\s*26px/);
  // 长标题、长正文、长标签都不能溢出或挤压
  assert.match(titleRow, /flex-wrap:\s*wrap/);
  assert.match(styles, /\.detail-title-row h3\s*\{[^}]+overflow-wrap:\s*anywhere/);
  assert.match(threadActions, /overflow-wrap:\s*anywhere/);
  assert.match(styles, /\.community-comment-list span\s*\{[^}]+white-space:\s*pre-wrap/);
  assert.match(chainEmpty, /padding:\s*10px 12px/);
});

test('admin workspaces release the sticky detail rail on narrow screens', () => {
  const styles = read('./admin/styles.css');
  const mediaBlocks = (query) => [...styles.matchAll(new RegExp(`@media \\(max-width: ${query}\\) \\{[\\s\\S]*?\\n\\}`, 'g'))].map((match) => match[0]);
  const narrowQuery = mediaBlocks('1180px').find((block) => block.includes('.exhibition-workbench')) ?? '';
  const communityQuery = mediaBlocks('1080px').find((block) => block.includes('.community-detail-panel')) ?? '';

  assert.notEqual(narrowQuery, '');
  assert.notEqual(communityQuery, '');
  assert.match(narrowQuery, /\.product-workbench,\s*\n\s*\.exhibition-workbench,\s*\n\s*\.article-workbench,\s*\n\s*\.favorite-workbench/);
  assert.match(narrowQuery, /max-height:\s*none/);
  assert.match(narrowQuery, /overflow:\s*visible/);
  assert.match(communityQuery, /\.community-detail-panel,\s*\n\s*\.community-post-side/);
  assert.match(communityQuery, /\.community-post-layout/);
});

test('community qa opens a standalone post detail page from the list', () => {
  const router = read('./router/index.ts');
  const navigation = read('./admin/adminNavigation.ts');
  const shell = read('./admin/AdminApp.vue');
  const page = read('./features/community/views/admin/CommunityQaPage.vue');
  const detailPage = read('./features/community/views/admin/CommunityQuestionDetailPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(router, /path: '\/admin\/content\/community\/:questionId'/);
  assert.match(navigation, /\^\\\/admin\\\/content\\\/community\\\/\[\^\/\]\+\$/);
  assert.match(navigation, /return '\/admin\/content\/community';/);
  assert.match(shell, /CommunityQuestionDetailPage/);
  assert.match(shell, /<CommunityQuestionDetailPage v-if="route\.params\.questionId" \/>/);
  assert.match(shell, /<CommunityQaPage v-else \/>/);

  // 列表卡片提供入口，点击不触发"选中到右栏"
  assert.match(page, /function openQuestionDetail\(question: CommunityQuestionItem\)/);
  assert.match(page, /router\.push\(`\/admin\/content\/community\/\$\{question\.id\}`\)/);
  assert.match(page, /class="community-detail-link"/);
  assert.match(page, /@click\.stop="openQuestionDetail\(question\)"/);

  // 详情页自带数据加载、互动与删除确认
  assert.match(detailPage, /fetchCommunityQuestion/);
  assert.match(detailPage, /watch\(questionId, load, \{ immediate: true \}\)/);
  assert.match(detailPage, /createCommunityAnswer/);
  assert.match(detailPage, /createCommunityAnswerComment/);
  assert.match(detailPage, /createCommunityQuestionComment/);
  assert.match(detailPage, /likeCommunityQuestion/);
  assert.match(detailPage, /deleteCommunityQuestion/);
  assert.match(detailPage, /class="community-post-layout"/);
  assert.match(detailPage, /class="community-post-main"/);
  assert.match(detailPage, /class="community-post-side"/);
  assert.match(detailPage, /confirm-modal-danger/);
  assert.doesNotMatch(detailPage, /window\.confirm/);
  assert.match(styles, /\.community-post-layout\s*\{[^}]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(300px,\s*340px\)/);
  // 右栏不再自带滚动条（否则栏底卡片会被裁切、右侧出现第二条滚动条）
  const postSide = [...styles.matchAll(/\.community-post-side\s*\{[^}]+\}/g)]
    .map((match) => match[0])
    .find((blockText) => blockText.includes('position: sticky')) ?? '';
  assert.match(postSide, /position:\s*sticky/);
  assert.match(postSide, /align-self:\s*start/);
  assert.doesNotMatch(postSide, /max-height/);
  assert.doesNotMatch(postSide, /overflow-y/);
});

test('article page shows the selected article detail rail next to the list', () => {
  const page = read('./features/article/views/admin/ArticleManagementPage.vue');
  const styles = read('./admin/styles.css');

  assert.match(page, /class="article-workbench"/);
  assert.match(page, /class="table-panel article-table-panel"/);
  assert.match(page, /class="data-table article-table"/);
  assert.match(page, /class="article-detail-panel"/);
  assert.match(page, /const selectedArticleMarkdown = computed\(\(\) => renderMarkdown\(selectedArticle\.value\?\.content \?\? ''\)\)/);
  assert.match(page, /await selectArticle\(articles\.value\[0\]\)/);
  assert.match(page, /:class="\{ selected: selectedArticle\?\.id === article\.id \}"/);
  assert.match(page, /@click="selectArticle\(article\)"/);
  assert.match(page, /<div class="row-actions" @click\.stop>/);
  assert.match(page, /class="markdown-body article-detail-markdown" v-html="selectedArticleMarkdown"/);
  assert.match(page, /选择一篇文章/);

  assert.match(styles, /\.article-workbench\s*\{[^}]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(320px,\s*400px\)[^}]+align-items:\s*stretch/);
  assert.match(styles, /\.article-table-panel\s*\{[^}]+display:\s*flex/);
  assert.match(styles, /\.article-table-panel \.pagination\s*\{[^}]+margin-top:\s*auto/);
  const articleRail = styles.match(/\.article-detail-panel\s*\{[^}]+\}/)?.[0] ?? '';
  assert.match(articleRail, /position:\s*sticky/);
  assert.match(articleRail, /align-self:\s*start/);
  assert.doesNotMatch(articleRail, /overflow-y/);
  assert.match(styles, /\.article-table tbody tr\.selected/);
});

test('portal stylesheet owns the surface tokens that the globally imported admin stylesheet would leak', () => {
  const main = read('./main.ts');
  const adminStyles = read('./admin/styles.css');
  const portalStyles = read('./heritage-intro/styles.css');
  const portalEntry = read('./heritage-intro/PortalHeritageEntry.vue');

  // The admin stylesheet is imported globally, so its :root dark tokens apply to the
  // portal too unless the portal re-declares them.
  assert.match(main, /import '\.\/admin\/styles\.css';/);
  assert.match(adminStyles, /--surface:\s*rgba\(30,\s*23,\s*18,\s*0\.8\)/);

  const portalRoot = portalStyles.match(/:root\s*\{[^}]*\}/);
  assert.ok(portalRoot, 'portal stylesheet must declare a :root block');
  assert.match(portalRoot[0], /--surface:\s*rgba\(255,\s*255,\s*255/);
  assert.match(portalRoot[0], /--surface-strong:\s*rgba\(255,\s*255,\s*255/);
  assert.match(portalRoot[0], /--heritage-paper:/);

  // The portal stylesheet is mounted as an injected <style> and removed on unmount,
  // so the light token override cannot leak back into the admin shell.
  assert.match(portalEntry, /data-heritage-intro-theme/);
  assert.match(portalEntry, /onUnmounted\(\(\)\s*=>\s*\{[\s\S]*?styleElement\?\.remove\(\)/);
});

test('collection learning surfaces read the shared --learn-* palette on both shells', () => {
  const portalStyles = read('./heritage-intro/styles.css');
  const adminStyles = read('./admin/styles.css');
  const indexPage = read('./features/favorite/views/portal/LearningIndexPage.vue');
  const studyPage = read('./features/favorite/views/portal/LearningStudyPage.vue');
  const adminPage = read('./features/favorite/views/admin/FavoriteGraphPage.vue');

  const portalRoot = portalStyles.match(/:root\s*\{[^}]*\}/)?.[0] ?? '';
  assert.match(portalRoot, /--learn-seal:/);
  assert.match(portalRoot, /--learn-amber:/);
  assert.match(portalRoot, /--learn-jade:/);

  const adminDarkRoot = adminStyles.match(/:root\s*\{[^}]*\}/)?.[0] ?? '';
  const adminGlassRoot = adminStyles.match(/:root\[data-theme="glass"\]\s*\{[^}]*\}/)?.[0] ?? '';
  assert.match(adminDarkRoot, /--learn-paper:/);
  assert.match(adminGlassRoot, /--learn-paper:/);

  // Portal (Task 7 retarget: the retired portal workspace page was deleted):
  // 学习仪表条与周进度环在学习索引页；起点式空态两页共用；学习页还有笔记区与 AI 区块。
  assert.match(indexPage, /class="learn-metrics"/);
  assert.match(indexPage, /class="learn-ring"/);
  assert.match(indexPage, /class="learn-empty-card"/);
  assert.match(studyPage, /class="learn-empty-card"/);
  assert.match(studyPage, /class="side-section study-note"/);
  assert.match(studyPage, /class="side-section study-ai"/);
  assert.doesNotMatch(indexPage, /sortOrder/);
  assert.doesNotMatch(studyPage, /sortOrder/);

  // Admin: 学习档案口径、可折叠 composer、列表元信息、关系图图例。
  assert.match(adminPage, /学习档案 · 用户学习轨迹/);
  assert.match(adminPage, /class="archive-owner-card"/);
  assert.match(adminPage, /class="favorite-composer-head"/);
  assert.match(adminPage, /class="favorite-composer-body"/);
  assert.match(adminPage, /class="archive-card-meta"/);
  assert.match(adminPage, /class="archive-graph-legend"/);
  assert.match(adminPage, /function archiveStatus\(item: FavoriteNodeItem\)/);
  assert.doesNotMatch(adminPage, /公开授权子图/);
});


