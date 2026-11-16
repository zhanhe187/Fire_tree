<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AiFloatingAssistant from '../shared/components/AiFloatingAssistant.vue';
import {
  Activity,
  AlertTriangle,
  ArrowLeftToLine,
  BarChart3,
  Boxes,
  CalendarCheck,
  CircleUserRound,
  CircleDot,
  Database,
  FileCheck2,
  GitBranch,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  PackageCheck,
  UserRound,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UsersRound,
} from 'lucide-vue-next';
import { fetchCurrentUser } from '../features/auth/services/auth';
import { GraphOverview, fetchGraphOverview } from '../features/graph/services/graph';
import { resolveMediaUrl } from '../shared/utils/mediaUrl';
import { DashboardSummary, HealthResponse, fetchDashboardSummary, fetchHealth } from '../features/system/services/system';
import { authSession, clearAuthSession, setAuthSession } from '../features/auth/services/authState';
import {
  canAccessAdminRoute,
  filterAdminNavigationGroups,
  firstAdminRouteForRoles,
  findAdminNavigationByRoute,
  findAdminNavigationByView,
  type AdminGraphTab,
  type AdminNavigationItem,
  type AdminViewKey,
} from './adminNavigation';
import {
  adminDashboardModules,
  adminTopbarEyebrow,
  adminTopbarTitle,
  previewTypeDescriptions,
  type AdminDashboardModule,
} from './adminDashboardConfig';

const AnalyticsMapPage = defineAsyncComponent(() => import('../features/analytics/views/admin/AnalyticsMapPage.vue'));
const ApplicationReviewPage = defineAsyncComponent(() => import('../features/application/views/admin/ApplicationReviewPage.vue'));
const CommunityQaPage = defineAsyncComponent(() => import('../features/community/views/admin/CommunityQaPage.vue'));
const CommunityQuestionDetailPage = defineAsyncComponent(() => import('../features/community/views/admin/CommunityQuestionDetailPage.vue'));
const EdgeManagementPage = defineAsyncComponent(() => import('../features/graph/views/admin/EdgeManagementPage.vue'));
const FavoriteGraphPage = defineAsyncComponent(() => import('../features/favorite/views/admin/FavoriteGraphPage.vue'));
const GraphBoardPage = defineAsyncComponent(() => import('../features/graph/views/admin/GraphBoardPage.vue'));
const LearningCheckinPage = defineAsyncComponent(() => import('../features/learning/views/admin/LearningCheckinPage.vue'));
const MediaArchivePage = defineAsyncComponent(() => import('../features/media/views/admin/MediaArchivePage.vue'));
const NodeManagementPage = defineAsyncComponent(() => import('../features/graph/views/admin/NodeManagementPage.vue'));
const ProductOrderManagementPage = defineAsyncComponent(() => import('../features/product/views/admin/ProductOrderManagementPage.vue'));
const ProductReviewPage = defineAsyncComponent(() => import('../features/product/views/admin/ProductReviewPage.vue'));
const ArticleManagementPage = defineAsyncComponent(() => import('../features/article/views/admin/ArticleManagementPage.vue'));
const ExhibitionManagementPage = defineAsyncComponent(() => import('../features/exhibition/views/admin/ExhibitionManagementPage.vue'));
const RiskReportPage = defineAsyncComponent(() => import('../features/governance/views/admin/RiskReportPage.vue'));
const ContentGovernancePage = defineAsyncComponent(() => import('../features/governance/views/admin/ContentGovernancePage.vue'));
const UserAccountManagementPage = defineAsyncComponent(() => import('../features/admin/views/admin/UserAccountManagementPage.vue'));

type ViewKey = AdminViewKey;
type GraphTab = AdminGraphTab;
type ThemeKey = 'dark' | 'glass';

const route = useRoute();
const router = useRouter();
const activeView = ref<ViewKey>('dashboard');
const graphTab = ref<GraphTab>('board');
const theme = ref<ThemeKey>('dark');
const health = ref<HealthResponse | null>(null);
const graph = ref<GraphOverview | null>(null);
const summary = ref<DashboardSummary | null>(null);
const authToken = ref('');
const loading = ref(true);
const apiError = ref('');
const authError = ref('');
const activePreviewCode = ref('');
const sessionChecked = ref(false);
const auth = computed(() => authSession.auth);
const currentRoleCodes = computed(() => auth.value?.roles.map((role) => role.roleCode) ?? []);
const isSuperAdmin = computed(() => currentRoleCodes.value.includes('SUPER_ADMIN'));
const visibleAdminNavigationGroups = computed(() => filterAdminNavigationGroups(currentRoleCodes.value));
const visibleAdminNavigationItems = computed(() => visibleAdminNavigationGroups.value.flatMap((group) => group.items));
const hasBackstageAccess = computed(() => visibleAdminNavigationItems.value.length > 0);

const modules = adminDashboardModules;

const visibleModules = computed(() => modules.filter((module) => {
  const tab = (module as { tab?: GraphTab }).tab;
  const routeOverride = (module as { routeOverride?: string }).routeOverride;
  if (routeOverride) {
    return canAccessAdminRoute(routeOverride, currentRoleCodes.value);
  }
  const target = findAdminNavigationByView(module.view, tab);
  return Boolean(target && canAccessAdminRoute(target.route, currentRoleCodes.value));
}));

const stats = computed(() => [
  { label: '角色', value: summary.value?.roleCount ?? 0, icon: UsersRound },
  { label: '权限点', value: summary.value?.permissionCount ?? 0, icon: ShieldCheck },
  { label: '节点类型', value: graph.value?.nodeTypeCount ?? 0, icon: Tags },
  { label: '关系类型', value: graph.value?.edgeTypeCount ?? 0, icon: GitBranch },
  { label: '风险规则', value: summary.value?.riskRuleCount ?? 0, icon: Activity },
  { label: '媒体档案', value: summary.value?.mediaFileCount ?? 0, icon: Boxes },
]);

const graphNodes = computed(() => graph.value?.nodeTypes.slice(0, 8) ?? []);
const previewLayout = [
  [150, 200],
  [385, 92],
  [610, 190],
  [620, 295],
  [385, 332],
  [150, 300],
  [275, 210],
  [495, 240],
];
const previewNodes = computed(() => graphNodes.value.map((node, index) => ({
  ...node,
  x: previewLayout[index]?.[0] ?? 380,
  y: previewLayout[index]?.[1] ?? 210,
  delay: `${index * 0.16}s`,
})));
const activePreviewNode = computed(() => previewNodes.value.find((node) => node.code === activePreviewCode.value));
const activePreviewIntro = computed(() => {
  const node = activePreviewNode.value;
  if (!node) return '';
  const description = (node as { description?: string }).description;
  return description || previewTypeDescriptions[node.code] || `${node.name}用于归集非遗知识图谱中的同类数据，并与项目、传承、地域和媒资节点形成可追溯关系。`;
});
const themeLabel = computed(() => (theme.value === 'dark' ? '水墨暗色' : '亮色琉璃'));
const authRoleLabel = computed(() => auth.value?.roles.map((role) => role.roleName).join(' / ') || '未登录');
const authMenuPreview = computed(() => auth.value?.menus.slice(0, 4).map((item) => item.permissionName).join('、') || '登录后加载可见菜单');
const authPermissionCount = computed(() => auth.value?.permissions.length ?? 0);
const currentUserId = computed(() => auth.value?.user.id ?? null);
const avatarUrl = computed(() => resolveMediaUrl(auth.value?.user.avatarUrl));
const avatarText = computed(() => (auth.value?.user.nickname || auth.value?.user.username || '访客').slice(0, 1));

const topbarEyebrow = computed(() => adminTopbarEyebrow(activeView.value, isSuperAdmin.value, route.path));

const topbarTitle = computed(() => adminTopbarTitle(activeView.value, isSuperAdmin.value, route.path));

async function load() {
  loading.value = true;
  apiError.value = '';

  try {
    const [healthData, graphData] = await Promise.all([
      fetchHealth(),
      fetchGraphOverview(),
    ]);
    health.value = healthData;
    graph.value = graphData;
    summary.value = isSuperAdmin.value
      ? await fetchDashboardSummary()
      : {
          roleCount: auth.value?.roles.length ?? 0,
          permissionCount: auth.value?.permissions.length ?? 0,
          riskRuleCount: 0,
          pendingApplicationCount: 0,
          openRiskReportCount: 0,
          mediaFileCount: 0,
          productCount: 0,
        };
    activePreviewCode.value = activePreviewCode.value || graphData.nodeTypes[0]?.code || '';
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '接口连接失败';
  } finally {
    loading.value = false;
  }
}

async function loadCurrentUser(token: string) {
  authError.value = '';
  try {
    setAuthSession(await fetchCurrentUser(token));
    authToken.value = token;
    window.localStorage.setItem('heritage-auth-token', token);
  } catch (error) {
    clearAuthSession();
    authToken.value = '';
    window.localStorage.removeItem('heritage-auth-token');
    authError.value = error instanceof Error ? error.message : '登录状态已过期';
  }
}

function logout() {
  clearAuthSession();
  authToken.value = '';
  authError.value = '';
  window.localStorage.removeItem('heritage-auth-token');
  void router.push('/');
}

function openProfilePage() {
  void router.push('/profile');
}

function healthStatusLabel(status?: string) {
  if (!status) return '连接中';
  return status === 'UP' ? '正常' : status;
}

function setTheme(nextTheme: ThemeKey) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('heritage-theme', nextTheme);
}

function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'glass' : 'dark');
}

function openModule(module: AdminDashboardModule) {
  activeView.value = module.view;
  const tab = (module as { tab?: GraphTab }).tab;
  if (tab) {
    graphTab.value = tab;
  }
  const routeOverride = (module as { routeOverride?: string }).routeOverride;
  if (routeOverride) {
    if (canAccessAdminRoute(routeOverride, currentRoleCodes.value)) {
      void router.push(routeOverride);
    }
    return;
  }
  const target = findAdminNavigationByView(module.view, tab);
  if (target && canAccessAdminRoute(target.route, currentRoleCodes.value)) {
    void router.push(target.route);
  }
}

function navIcon(item: AdminNavigationItem) {
  if (item.key === 'dashboard') return LayoutDashboard;
  if (item.key === 'applications') return FileCheck2;
  if (item.key === 'risk') return AlertTriangle;
  if (item.key === 'media') return Boxes;
  if (item.key === 'governance') return ShieldCheck;
  if (item.key === 'community') return MessageCircleQuestion;
  if (item.key === 'favorites') return Heart;
  if (item.key === 'learning') return CalendarCheck;
  if (item.key === 'products') return PackageCheck;
  if (item.key === 'articles') return FileCheck2;
  if (item.key === 'exhibitions') return Landmark;
  if (item.key === 'users') return UsersRound;
  if (item.key === 'analytics') return BarChart3;
  return item.graphTab === 'nodes' ? CircleDot : GitBranch;
}

function displayNavLabel(item: AdminNavigationItem) {
  if (item.key === 'applications' && !isSuperAdmin.value) return '项目申报';
  return item.label;
}

function displayModuleName(module: AdminDashboardModule) {
  if (module.view === 'applications' && !isSuperAdmin.value) return '项目申报';
  return module.name;
}

function displayModuleDetail(module: AdminDashboardModule) {
  if (module.view === 'applications' && !isSuperAdmin.value) return '创建草稿、提交审核、查看审核历史';
  return module.detail;
}

function isActiveNav(item: AdminNavigationItem) {
  if (activeView.value !== item.key) return false;
  if (item.key === 'graph') return item.graphTab === graphTab.value;
  if (item.key === 'products') {
    return item.route === route.path;
  }
  return true;
}

function openAdminNav(item: AdminNavigationItem) {
  activeView.value = item.key;
  if (item.graphTab) {
    graphTab.value = item.graphTab;
  }
  void router.push(item.route);
}

function canAccessGraphTab(tab: GraphTab) {
  const target = findAdminNavigationByView('graph', tab);
  return Boolean(target && canAccessAdminRoute(target.route, currentRoleCodes.value));
}

function setGraphTab(tab: GraphTab) {
  if (!canAccessGraphTab(tab)) return;
  graphTab.value = tab;
  const target = findAdminNavigationByView('graph', tab);
  if (target) {
    void router.push(target.route);
  }
}

function syncRouteToState(path: string) {
  if (!auth.value) return;
  if (!hasBackstageAccess.value) {
    void router.replace('/');
    return;
  }
  if (path === '/admin') {
    const firstRoute = firstAdminRouteForRoles(currentRoleCodes.value);
    if (firstRoute) {
      void router.replace(firstRoute);
    }
    return;
  }
  if (!canAccessAdminRoute(path, currentRoleCodes.value)) {
    const firstRoute = firstAdminRouteForRoles(currentRoleCodes.value);
    if (firstRoute) {
      void router.replace(firstRoute);
    }
    return;
  }
  const target = findAdminNavigationByRoute(path);
  if (!target) return;
  activeView.value = target.key;
  if (target.graphTab) {
    graphTab.value = target.graphTab;
  }
}

watch([() => route.path, currentRoleCodes, sessionChecked], ([path]) => {
  if (!sessionChecked.value) return;
  if (!auth.value) {
    void router.replace({ path: '/login', query: { redirect: path } });
    return;
  }
  syncRouteToState(path);
}, { immediate: true });
watch(() => auth.value?.user.id, () => {
  void load();
});

onMounted(async () => {
  const savedTheme = window.localStorage.getItem('heritage-theme');
  setTheme(savedTheme === 'glass' ? 'glass' : 'dark');
  const savedToken = window.localStorage.getItem('heritage-auth-token');
  if (savedToken) {
    await loadCurrentUser(savedToken);
  }
  sessionChecked.value = true;
  await load();
});
</script>

<template>
  <main v-if="auth" class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <Landmark :size="24" />
        </div>
        <div>
          <strong>非遗图谱</strong>
          <span>文化知识图谱</span>
        </div>
      </div>

      <RouterLink class="return-portal-link" to="/" aria-label="返回用户端页面">
        <ArrowLeftToLine :size="16" />
        <span>返回用户端</span>
      </RouterLink>

      <nav class="nav">
        <section v-for="group in visibleAdminNavigationGroups" :key="group.label" class="nav-group">
          <p class="nav-group-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.route"
            class="nav-item"
            :class="{ active: isActiveNav(item) }"
            type="button"
            @click="openAdminNav(item)"
          >
            <component :is="navIcon(item)" :size="18" />
            <span>{{ displayNavLabel(item) }}</span>
          </button>
        </section>
      </nav>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ topbarEyebrow }}</p>
          <h1>{{ topbarTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <details class="personal-settings">
            <summary class="personal-settings-trigger" aria-label="个人设置">
              <div class="session-avatar">
                <img v-if="avatarUrl" :src="avatarUrl" alt="" />
                <span v-else-if="auth">{{ avatarText }}</span>
                <CircleUserRound v-else :size="20" />
              </div>
              <span>
                <strong>{{ auth?.user.nickname || '未登录用户' }}</strong>
                <small>{{ auth ? authRoleLabel : '点击设置身份' }}</small>
              </span>
              <Settings :size="16" />
            </summary>

            <section class="personal-settings-panel" aria-label="个人设置面板">
              <section class="session-card" :class="{ signed: auth }" aria-label="当前登录身份">
                <div class="session-avatar">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="" />
                  <span v-else-if="auth">{{ avatarText }}</span>
                  <CircleUserRound v-else :size="20" />
                </div>
                <div class="session-copy">
                  <strong>{{ auth?.user.nickname || '未登录用户' }}</strong>
                  <span>{{ auth ? `${authRoleLabel} / ${authPermissionCount} 个权限` : '请通过正式登录入口登录' }}</span>
                </div>
                <div class="session-tools">
                  <button class="icon-only" type="button" title="设置管理">
                    <Settings :size="15" />
                  </button>
                  <button v-if="auth" class="icon-only" type="button" title="退出登录" @click="logout">
                    <LogOut :size="15" />
                  </button>
                </div>
              </section>

              <button class="personal-profile-link" type="button" @click="openProfilePage">
                <UserRound :size="18" />
                <span>
                  <strong>个人信息</strong>
                  <small>头像、联系方式与账号资料</small>
                </span>
              </button>

              <div class="personal-status-list">
                <div class="db-pill" :class="{ offline: apiError }" aria-label="数据库状态">
                  <Database :size="18" />
                  <span v-if="health">{{ health.database }} / {{ healthStatusLabel(health.status) }}</span>
                  <span v-else-if="apiError">后端未连接</span>
                  <span v-else>连接中</span>
                </div>
                <button class="theme-toggle" type="button" aria-label="主题切换" @click="toggleTheme">
                  <Sparkles :size="16" />
                  <span>{{ themeLabel }}</span>
                </button>
              </div>
            </section>
          </details>
        </div>
      </header>

      <div v-if="apiError" class="alert" role="status">
        <ShieldCheck :size="18" />
        <span>
          <strong>前端已启动，等待后端 API</strong>
          <small>请先启动 backend，当前错误：{{ apiError }}</small>
        </span>
      </div>

      <div v-if="authError" class="alert auth-alert" role="status">
        <ShieldCheck :size="18" />
        <span>
          <strong>权限会话未建立</strong>
          <small>{{ authError }}</small>
        </span>
      </div>

      <template v-if="activeView === 'dashboard'">
        <section class="stats-grid" :class="{ loading }">
          <article v-for="item in stats" :key="item.label" class="stat-card">
            <component :is="item.icon" :size="19" />
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </section>

        <section class="main-grid">
          <article class="graph-panel">
            <div class="panel-title">
              <div>
                <p class="eyebrow">图谱预览</p>
                <h2>核心节点类型</h2>
              </div>
              <button class="icon-btn" type="button" title="刷新数据" @click="load">
                <Activity :size="18" />
              </button>
            </div>

            <div class="graph-canvas">
              <svg viewBox="0 0 760 420" role="img" aria-label="知识图谱节点类型预览">
                <defs>
                  <radialGradient id="preview-node-glass" cx="32%" cy="24%" r="72%">
                    <stop offset="0%" stop-color="#fff3d1" stop-opacity="0.9" />
                    <stop offset="44%" stop-color="#d7a84f" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="#101211" stop-opacity="0.18" />
                  </radialGradient>
                  <filter id="preview-node-depth" x="-70%" y="-70%" width="240%" height="240%">
                    <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.48" />
                    <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#d7a84f" flood-opacity="0.18" />
                  </filter>
                </defs>
                <path class="edge edge-a" :class="{ active: ['heritage_project', 'inheritor', 'region'].includes(activePreviewCode) }" d="M150 200 C260 90, 480 90, 610 190" />
                <path class="edge edge-b" :class="{ active: ['work', 'craft_material', 'region'].includes(activePreviewCode) }" d="M160 220 C280 360, 480 340, 620 220" />
                <path class="edge edge-c" :class="{ active: ['inheritor', 'craft_material'].includes(activePreviewCode) }" d="M385 92 C335 190, 360 260, 385 332" />
                <g
                  v-for="node in previewNodes"
                  :key="node.code"
                  class="node preview-node"
                  :class="{ active: activePreviewCode === node.code }"
                  :style="{ '--node-delay': node.delay }"
                  :transform="`translate(${node.x}, ${node.y})`"
                  role="button"
                  tabindex="0"
                  @click="activePreviewCode = node.code"
                  @keydown.enter.prevent="activePreviewCode = node.code"
                  @keydown.space.prevent="activePreviewCode = node.code"
                >
                  <circle r="48" class="node-halo" />
                  <circle r="38" class="node-depth-disc" />
                  <circle r="34" :fill="node.color || '#b94735'" class="node-core" />
                  <circle r="34" fill="url(#preview-node-glass)" class="node-glass" />
                  <ellipse rx="14" ry="6" cy="-13" class="node-highlight" />
                  <text y="5">{{ node.name }}</text>
                </g>
              </svg>
              <article v-if="activePreviewNode" class="preview-info-card">
                <div>
                  <span>已聚焦</span>
                  <strong>{{ activePreviewNode.name }}</strong>
                </div>
                <p>{{ activePreviewIntro }}</p>
              </article>
            </div>
          </article>

          <article class="module-panel">
            <div class="panel-title">
              <div>
                <p class="eyebrow">功能模块</p>
                <h2>模块入口</h2>
              </div>
            </div>

            <div class="module-list">
              <button
                v-for="module in visibleModules"
                :key="module.name"
                class="module-row"
                :class="module.accent"
                type="button"
                @click="openModule(module)"
              >
                <component :is="module.icon" :size="20" />
                <span>
                  <strong>{{ displayModuleName(module) }}</strong>
                  <small>{{ displayModuleDetail(module) }}</small>
                </span>
              </button>
            </div>
          </article>
        </section>

        <section class="rbac-overview">
          <article>
            <p class="eyebrow">RBAC</p>
            <h2>角色权限概览</h2>
            <span>{{ authMenuPreview }}</span>
          </article>
          <div class="rbac-menus">
            <span v-for="item in auth?.menus.slice(0, 8) ?? []" :key="item.permissionCode">
              {{ item.permissionName }}
            </span>
            <span v-if="!auth">使用演示身份登录后查看菜单授权</span>
          </div>
        </section>
      </template>

      <template v-else-if="activeView === 'graph'">
        <div class="graph-tabs">
          <button v-if="canAccessGraphTab('board')" type="button" :class="{ active: graphTab === 'board' }" @click="setGraphTab('board')">图谱看板</button>
          <button v-if="canAccessGraphTab('nodes')" type="button" :class="{ active: graphTab === 'nodes' }" @click="setGraphTab('nodes')">节点管理</button>
          <button v-if="canAccessGraphTab('edges')" type="button" :class="{ active: graphTab === 'edges' }" @click="setGraphTab('edges')">关系管理</button>
        </div>
        <GraphBoardPage v-if="graphTab === 'board'" />
        <NodeManagementPage v-else-if="graphTab === 'nodes'" />
        <EdgeManagementPage v-else />
      </template>

      <template v-else-if="activeView === 'risk'">
        <RiskReportPage />
      </template>

      <template v-else-if="activeView === 'applications'">
        <ApplicationReviewPage />
      </template>

      <template v-else-if="activeView === 'governance'">
        <ContentGovernancePage />
      </template>

      <template v-else-if="activeView === 'community'">
        <CommunityQuestionDetailPage v-if="route.params.questionId" />
        <CommunityQaPage v-else />
      </template>

      <template v-else-if="activeView === 'favorites'">
        <FavoriteGraphPage :current-user-id="currentUserId" />
      </template>

      <template v-else-if="activeView === 'learning'">
        <LearningCheckinPage :current-user-id="currentUserId" />
      </template>

      <template v-else-if="activeView === 'products'">
        <ProductReviewPage v-if="route.path === '/admin/content/products'" />
        <ProductOrderManagementPage v-else />
      </template>

      <template v-else-if="activeView === 'articles'">
        <ArticleManagementPage />
      </template>

      <template v-else-if="activeView === 'exhibitions'">
        <ExhibitionManagementPage />
      </template>

      <template v-else-if="activeView === 'users'">
        <UserAccountManagementPage />
      </template>

      <template v-else-if="activeView === 'analytics'">
        <AnalyticsMapPage />
      </template>

      <template v-else>
        <MediaArchivePage />
      </template>
    </section>
    <AiFloatingAssistant audience="admin" :role-codes="currentRoleCodes" />
  </main>
  <div v-else class="admin-session-loading" role="status">
    <ShieldCheck :size="22" />
    <span>正在验证登录状态...</span>
  </div>
</template>

<style scoped>
.admin-session-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 100vh;
  color: #f7dfad;
  background: #101211;
  font-weight: 800;
  letter-spacing: 0.02em;
}
</style>
