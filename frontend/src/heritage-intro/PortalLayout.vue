<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';

const navItems = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '浏览' },
  { to: '/graph', label: '图谱' },
  { to: '/community', label: '问答' },
  { to: '/favorites', label: '收藏学习' },
];
</script>

<template>
  <div class="portal-shell">
    <header class="portal-nav">
      <RouterLink class="portal-brand" to="/" aria-label="非遗文化数字门户首页">
        <span>火树</span>
        <strong>非遗文化数字门户</strong>
      </RouterLink>
      <nav aria-label="用户端导航">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>
      <RouterLink class="portal-admin-link" to="/admin">管理后台</RouterLink>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.portal-shell {
  min-height: 100vh;
  color: #271d15;
  background:
    linear-gradient(90deg, rgba(128, 31, 23, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(128, 31, 23, 0.06) 1px, transparent 1px),
    radial-gradient(circle at 20% 8%, rgba(194, 59, 43, 0.22), transparent 28%),
    radial-gradient(circle at 76% 18%, rgba(218, 166, 78, 0.22), transparent 30%),
    linear-gradient(145deg, #fff8ea 0%, #efe2ca 52%, #f8f0df 100%);
  background-size: 42px 42px, 42px 42px, auto, auto, auto;
}

.portal-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr auto;
  align-items: center;
  gap: 24px;
  min-height: 76px;
  padding: 0 clamp(18px, 4vw, 48px);
  border-bottom: 1px solid rgba(76, 50, 31, 0.16);
  background: rgba(255, 248, 232, 0.82);
  backdrop-filter: blur(18px);
}

.portal-brand,
.portal-admin-link,
.portal-nav a {
  color: inherit;
  text-decoration: none;
}

.portal-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.portal-brand span {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(128, 31, 23, 0.34);
  background: #791f19;
  color: #f7dfad;
  font-family: var(--font-display);
  font-size: 18px;
}

.portal-brand strong {
  font-size: 16px;
  letter-spacing: 0;
}

.portal-nav nav {
  display: flex;
  justify-content: center;
  gap: clamp(12px, 3vw, 34px);
}

.portal-nav nav a {
  position: relative;
  padding: 9px 0;
  color: rgba(39, 29, 21, 0.66);
  font-size: 14px;
  font-weight: 700;
}

.portal-nav nav a.router-link-active {
  color: #7d2119;
}

.portal-nav nav a.router-link-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  height: 2px;
  background: #b6402e;
}

.portal-admin-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(128, 31, 23, 0.28);
  background: rgba(255, 255, 255, 0.38);
  color: #7d2119;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 860px) {
  .portal-nav {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-block: 14px;
  }

  .portal-nav nav {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .portal-admin-link {
    justify-self: start;
  }
}
</style>
