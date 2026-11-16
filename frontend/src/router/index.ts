import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { adminRoutePaths } from '../admin/adminNavigation';

const AdminShell = () => import('../admin/AdminApp.vue');
const HeritageIntroApp = () => import('../heritage-intro/PortalHeritageEntry.vue');

const adminRoutes: RouteRecordRaw[] = adminRoutePaths.map((path) => ({
  path,
  ...(path === '/admin/system/users' ? { name: 'admin-user-management' } : {}),
  component: AdminShell,
}));

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'heritage-home',
    component: HeritageIntroApp,
  },
  { path: '/explore', name: 'heritage-explore', component: HeritageIntroApp },
  { path: '/heritage/:id', name: 'heritage-detail', component: HeritageIntroApp },
  { path: '/articles', name: 'heritage-articles', component: HeritageIntroApp },
  { path: '/articles/:id', name: 'heritage-article-detail', component: HeritageIntroApp },
  { path: '/exhibitions', name: 'heritage-exhibitions', component: HeritageIntroApp },
  { path: '/exhibitions/:id', name: 'heritage-exhibition-detail', component: HeritageIntroApp },
  { path: '/products', name: 'heritage-products', component: HeritageIntroApp },
  { path: '/products/:id', name: 'heritage-product-detail', component: HeritageIntroApp },
  { path: '/graph', name: 'heritage-graph', component: HeritageIntroApp },
  { path: '/graph/board', name: 'heritage-graph-board', component: HeritageIntroApp },
  { path: '/community', name: 'heritage-community', component: HeritageIntroApp },
  { path: '/qa', name: 'heritage-qa', component: HeritageIntroApp },
  { path: '/qa/:questionId', name: 'heritage-qa-detail', component: HeritageIntroApp },
  { path: '/favorites', name: 'heritage-favorites', component: HeritageIntroApp },
  { path: '/favorites/space', redirect: '/favorites' },
  { path: '/favorites/study/:nodeId', name: 'heritage-favorites-study', component: HeritageIntroApp },
  { path: '/favorites/checkin', name: 'heritage-favorites-checkin', component: HeritageIntroApp },
  { path: '/material-submit', name: 'heritage-material-submit', component: HeritageIntroApp },
  { path: '/profile', name: 'heritage-profile', component: HeritageIntroApp },
  { path: '/orders', name: 'heritage-orders', component: HeritageIntroApp },
  { path: '/login', name: 'heritage-login', component: HeritageIntroApp },
  {
    path: '/admin',
    component: AdminShell,
  },
  { path: '/admin/graph/nodes/:nodeId', component: AdminShell },
  { path: '/admin/graph/edges/:edgeId', component: AdminShell },
  { path: '/admin/content/community/:questionId', component: AdminShell },
  ...adminRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
