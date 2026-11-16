export type AdminViewKey =
  | 'dashboard'
  | 'graph'
  | 'applications'
  | 'risk'
  | 'media'
  | 'community'
  | 'governance'
  | 'favorites'
  | 'learning'
  | 'products'
  | 'articles'
  | 'exhibitions'
  | 'users'
  | 'analytics';

export type AdminGraphTab = 'board' | 'nodes' | 'edges';

export type PageAudience = 'admin' | 'portal' | 'shared';

export interface PageMatrixItem {
  key: string;
  title: string;
  audience: PageAudience;
  domain: string;
  route: string;
  roles: string[];
  api: string[];
}

export interface AdminNavigationItem {
  key: AdminViewKey;
  label: string;
  route: string;
  graphTab?: AdminGraphTab;
  domain: string;
  roles: string[];
  api: string[];
}

export interface AdminNavigationGroup {
  label: string;
  items: AdminNavigationItem[];
}

export const ADMIN_ROLE = 'SUPER_ADMIN';
export const INHERITOR_ROLE = 'INHERITOR';
export const NORMAL_USER_ROLE = 'NORMAL_USER';

export function normalizeRoleCodes(roles: string[] = []) {
  return roles.map((role) => (role === 'NORMAL' ? NORMAL_USER_ROLE : role));
}

export function hasAnyRole(userRoles: string[], allowedRoles: string[]) {
  const normalizedUserRoles = new Set(normalizeRoleCodes(userRoles));
  return allowedRoles.some((role) => normalizedUserRoles.has(role));
}

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    label: '工作台',
    items: [
      {
        key: 'dashboard',
        label: '工作台',
        route: '/admin/dashboard',
        domain: '总览',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/health', '/api/dashboard/summary', '/api/graph/overview'],
      },
    ],
  },
  {
    label: '图谱管理',
    items: [
      {
        key: 'graph',
        label: '图谱看板',
        route: '/admin/graph/board',
        graphTab: 'board',
        domain: '图谱管理',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/graph/visualization', '/api/graph/search/semantic'],
      },
      {
        key: 'graph',
        label: '节点管理',
        route: '/admin/graph/nodes',
        graphTab: 'nodes',
        domain: '图谱管理',
        roles: ['SUPER_ADMIN'],
        api: ['/api/graph/node-types', '/api/graph/nodes'],
      },
      {
        key: 'graph',
        label: '关系管理',
        route: '/admin/graph/edges',
        graphTab: 'edges',
        domain: '图谱管理',
        roles: ['SUPER_ADMIN'],
        api: ['/api/graph/edge-types', '/api/graph/edges'],
      },
    ],
  },
  {
    label: '审核流程',
    items: [
      {
        key: 'applications',
        label: '申报审核',
        route: '/admin/review/applications',
        domain: '审核流程',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/applications'],
      },
      {
        key: 'risk',
        label: '风险报告',
        route: '/admin/review/risk',
        domain: '审核流程',
        roles: ['SUPER_ADMIN'],
        api: ['/api/risk/reports', '/api/risk/scan'],
      },
    ],
  },
  {
    label: '内容治理',
    items: [
      {
        key: 'media',
        label: '多媒体档案',
        route: '/admin/content/media',
        domain: '内容治理',
        roles: ['SUPER_ADMIN'],
        api: ['/api/media/files'],
      },
      {
        key: 'community',
        label: '社区问答',
        route: '/admin/content/community',
        domain: '内容治理',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/community/questions'],
      },
      {
        key: 'governance',
        label: '敏感词审核',
        route: '/admin/content/governance',
        domain: '内容治理',
        roles: ['SUPER_ADMIN'],
        api: ['/api/content-governance/sensitive-words', '/api/content-governance/review-records', '/api/content-governance/operation-logs'],
      },
      {
        key: 'products',
        label: '文创评价',
        route: '/admin/content/products',
        domain: '内容治理',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/products'],
      },
      {
        key: 'products',
        label: '订单管理',
        route: '/admin/content/product-orders',
        domain: '内容治理',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/products/purchase-orders'],
      },
      {
        key: 'articles',
        label: '资讯运营',
        route: '/admin/content/articles',
        domain: '内容治理',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/articles'],
      },
    ],
  },
  {
    label: '用户运营',
    items: [
      {
        key: 'favorites',
        label: '学习档案',
        route: '/admin/operations/favorites',
        domain: '用户运营',
        roles: ['SUPER_ADMIN'],
        api: ['/api/favorites/nodes', '/api/favorites/graph'],
      },
      {
        key: 'learning',
        label: '学习打卡',
        route: '/admin/operations/learning',
        domain: '用户运营',
        roles: ['SUPER_ADMIN'],
        api: ['/api/learning/recommendations/daily', '/api/learning/checkins'],
      },
      {
        key: 'exhibitions',
        label: '展览市集',
        route: '/admin/operations/exhibitions',
        domain: '用户运营',
        roles: ['SUPER_ADMIN', 'INHERITOR'],
        api: ['/api/exhibitions'],
      },
    ],
  },
  {
    label: '系统管理',
    items: [
      {
        key: 'users',
        label: '账号密码管理',
        route: '/admin/system/users',
        domain: '系统管理',
        roles: ['SUPER_ADMIN'],
        api: ['/api/admin/users'],
      },
    ],
  },
  {
    label: '运营分析',
    items: [
      {
        key: 'analytics',
        label: '大屏地图',
        route: '/admin/analytics/map',
        domain: '运营分析',
        roles: ['SUPER_ADMIN'],
        api: ['/api/analytics/overview', '/api/analytics/search-hot', '/api/analytics/behavior-trend', '/api/analytics/operation-audit'],
      },
    ],
  },
];

export const adminNavigationItems = adminNavigationGroups.flatMap((group) => group.items);

export const adminRoutePaths = adminNavigationItems.map((item) => item.route);

export const pageMatrix: PageMatrixItem[] = [
  ...adminNavigationItems.map((item) => ({
    key: item.route === '/admin/system/users' ? 'admin-user-management' : item.route,
    title: item.label,
    audience: 'admin' as const,
    domain: item.domain,
    route: item.route,
    roles: item.roles,
    api: item.api,
  })),
  {
    key: 'portal-home',
    title: '用户站首页',
    audience: 'portal',
    domain: '浏览体验',
    route: '/',
    roles: ['ANONYMOUS', 'NORMAL'],
    api: ['/api/graph/overview', '/api/learning/hot'],
  },
  {
    key: 'portal-explore',
    title: '项目与地区浏览',
    audience: 'portal',
    domain: '浏览体验',
    route: '/explore',
    roles: ['ANONYMOUS', 'NORMAL'],
    api: ['/api/graph/nodes', '/api/media/files'],
  },
  {
    key: 'portal-graph',
    title: '用户侧知识图谱探索',
    audience: 'shared',
    domain: '图谱探索',
    route: '/graph',
    roles: ['ANONYMOUS', 'NORMAL'],
    api: ['/api/graph/visualization', '/api/graph/search/semantic'],
  },
  {
    key: 'portal-community',
    title: '用户问答社区',
    audience: 'portal',
    domain: '互动社区',
    route: '/community',
    roles: ['ANONYMOUS', 'NORMAL', 'INHERITOR'],
    api: ['/api/community/questions'],
  },
  {
    key: 'portal-favorites',
    title: '个人收藏与学习图谱',
    audience: 'portal',
    domain: '个人学习',
    route: '/favorites',
    roles: ['NORMAL'],
    api: ['/api/favorites/nodes', '/api/learning/checkins'],
  },
];

function normalizeAdminRoute(path: string) {
  if (/^\/admin\/graph\/nodes\/[^/]+$/.test(path)) {
    return '/admin/graph/nodes';
  }
  if (/^\/admin\/graph\/edges\/[^/]+$/.test(path)) {
    return '/admin/graph/edges';
  }
  // 社区帖子详情页：复用"社区问答"的菜单归属与角色校验
  if (/^\/admin\/content\/community\/[^/]+$/.test(path)) {
    return '/admin/content/community';
  }
  return path;
}

export function findAdminNavigationByRoute(path: string) {
  const normalizedPath = normalizeAdminRoute(path);
  return adminNavigationItems.find((item) => item.route === normalizedPath);
}

export function findAdminNavigationByView(view: AdminViewKey, graphTab?: AdminGraphTab) {
  return adminNavigationItems.find((item) => (
    item.key === view && (item.graphTab === undefined || item.graphTab === graphTab)
  )) ?? adminNavigationItems.find((item) => item.key === view);
}

export function filterAdminNavigationItems(roleCodes: string[]) {
  return adminNavigationItems.filter((item) => hasAnyRole(roleCodes, item.roles));
}

export function filterAdminNavigationGroups(roleCodes: string[]) {
  return adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyRole(roleCodes, item.roles)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessAdminRoute(path: string, roleCodes: string[]) {
  const target = findAdminNavigationByRoute(path);
  return Boolean(target && hasAnyRole(roleCodes, target.roles));
}

export function firstAdminRouteForRoles(roleCodes: string[]) {
  return filterAdminNavigationItems(roleCodes)[0]?.route ?? null;
}
