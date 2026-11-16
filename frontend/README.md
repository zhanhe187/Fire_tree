# 前端说明（Vue 3 + Vite）

非遗文化知识图谱系统的前端，采用 **Vue 3 + TypeScript + Vue Router + Vite**，双入口构建，同时承载「公众数字门户」与「角色化后台工作台」。

## 应用装配

```text
index.html
  └── src/main.ts                  createApp(RootApp).use(router)
        └── src/RootApp.vue        <RouterView />
              └── src/router/index.ts
                    ├── 门户壳  heritage-intro/PortalHeritageEntry.vue
                    └── 后台壳  admin/AdminApp.vue
```

双入口（`vite.config.ts` 中配置的 `rollupOptions.input`）：

| 入口 HTML | 挂载点 | 说明 |
| --- | --- | --- |
| `index.html` | `#app` | 主应用（门户 + 后台共用同一 router） |
| `heritage-intro.html` | `#heritage-intro-app` | 门户独立入口 |

## 目录约定

- `src/features/<domain>/services/<domain>.ts` —— 该功能域的后端 API 客户端（类型化函数，封装 `request/send/sendForm`）。
- `src/features/<domain>/views/admin/` —— 后台页面。
- `src/features/<domain>/views/portal/` —— 门户页面。
- `src/admin/` —— 后台壳（`AdminApp.vue`）、导航/仪表盘配置、后台样式。
- `src/heritage-intro/` —— 门户壳（`PortalHeritageEntry.vue`、`App.vue`）、门户页面与动效组件。
- `src/services/` —— HTTP 客户端（`http.ts`）与后端错误翻译（`apiErrors.ts`）。
- `src/shared/` —— 共享组件、样式与工具（媒体地址标准化 `utils/mediaUrl.ts`、Markdown 渲染等）。

## 路由与权限

- 后台标准路由由 `src/admin/adminNavigation.ts` 的导航配置推导（`adminRoutePaths`），动态详情路由（节点/关系详情）在 `router/index.ts` 单独声明。
- 后台菜单按角色过滤：`SUPER_ADMIN`、`INHERITOR`、`NORMAL_USER`；角色→菜单→API 的映射集中在 `adminNavigation.ts`。
- 门户路由（首页、浏览、图谱、社区、文章、展览、文创、收藏学习、个人中心、登录等）在 `router/index.ts` 中声明。

## 本地运行

```powershell
npm install --legacy-peer-deps
npm run dev
```

默认 `http://localhost:5173`，`/api` 与 `/uploads` 通过 Vite 代理到后端。切换后端：

```powershell
$env:VITE_API_TARGET="http://localhost:8081"
npm run dev -- --port 5178 --strictPort
```

## 构建与验证

```powershell
npm run build                 # vue-tsc 类型检查 + vite 构建
node --test src/*.test.mjs src/**/*.test.mjs   # 契约测试
```
