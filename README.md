# 非遗文化知识图谱系统（Fire Tree）

一个面向非物质文化遗产（非遗）保护与传播的全栈知识图谱系统，包含面向公众的**数字门户**和面向管理者的**角色化后台工作台**。

系统以「非遗项目、传承人、地域、作品、工艺材料、历史时期、展览市集、文创产品」等实体为节点，通过师承、发源、作品、材料等关系构建知识图谱，并围绕图谱提供申报审核、风险推理、多媒体档案、社区问答、学习打卡、展览运营、文创转化、数据分析等业务能力。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3.5、TypeScript 5.7、Vue Router 4.6、Vite 6.3、Three.js/OGL（可视化动效） |
| 后端 | Java 17、Spring Boot 3.3、MyBatis-Plus 3.5、Spring Mail |
| 数据库 | MySQL 8（`heritage_graph` 库，启动时自动执行增量建表/加列） |
| 外部服务 | AI 大模型接口（DeepSeek，可选）、QQ 邮箱 SMTP（可选） |

## 目录结构

```text
Fire_tree_v2/
├── frontend/        Vue 前端：门户端 + 后台端（双入口构建）
│   └── src/
│       ├── main.ts / RootApp.vue / router/     应用装配与路由
│       ├── admin/                             后台壳（AdminApp.vue）与导航配置
│       ├── heritage-intro/                    门户壳（PortalHeritageEntry.vue）
│       ├── features/<domain>/                 按功能域组织的页面与服务
│       ├── services/                          HTTP 客户端与接口错误处理
│       └── shared/                            共享组件、样式与工具
├── backend/         Spring Boot 后端：按功能域分层（Controller/Service/Mapper/DTO）
│   └── src/main/java/com/firetree/heritage/
│       ├── features/<domain>/                 15 个功能域
│       └── config/                            MyBatis、数据库初始化、媒体资源配置
├── db/              数据库脚本与设计文档
│   ├── heritage_graph_schema.sql   39 张业务表完整建表脚本（MySQL 8）
│   └── 数据库设计说明.md            按七大模块分组的表结构（具体到属性）
├── docs/            项目文档
│   ├── 项目结构说明.md / 功能模块与实现总结.md
│   ├── design/      ER 图、用例图
│   └── thesis/      毕业论文与中期报告定稿
└── README.md
```

## 本地运行

### 前端

```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```

默认访问 `http://localhost:5173`，Vite 会把 `/api`、`/uploads` 代理到后端（默认 `http://localhost:8080`）。临时切换后端地址：

```powershell
$env:VITE_API_TARGET="http://localhost:8081"
npm run dev -- --port 5178 --strictPort
```

### 后端

1. 准备 MySQL。
2. 导入数据库结构：`mysql -uroot -p < db/heritage_graph_schema.sql`（应用启动时还会对旧库做增量补齐）。
3. 配置环境变量（见下文），或直接编辑 `backend/.env`。
4. 启动：

```powershell
cd backend
mvn spring-boot:run
```

后端默认监听 `http://localhost:8080`，并提供健康检查 `GET /api/health`。

## 关键配置

配置项通过环境变量或 `backend/.env` 注入，`backend/src/main/resources/application.yml` 提供默认值：

| 配置 | 说明 |
| --- | --- |
| `MYSQL_USERNAME` / `MYSQL_PASSWORD` | MySQL 账号，默认 `root/root` |
| `HERITAGE_AI_API_KEY` / `HERITAGE_AI_BASE_URL` / `HERITAGE_AI_MODEL` | AI 大模型接入（AI 问答、图谱语义搜索） |
| `HERITAGE_AUTH_TOKEN_SECRET` | 登录令牌签名密钥 |
| `HERITAGE_MAIL_ENABLED` / `QQ_MAIL_*` | 邮件验证码发送（可选） |
| `HERITAGE_MEDIA_UPLOAD_DIR` | 上传文件存储目录（默认 `D:/code/uploads/media`） |

## 构建与测试

```powershell
# 前端：类型检查 + 构建
cd frontend
npx vue-tsc --noEmit
npm run build

# 前端：契约测试（Node 内置测试运行器）
node --test src/*.test.mjs src/**/*.test.mjs

# 后端：测试与打包
cd backend
mvn test
mvn package -DskipTests
```

## 部署说明

- 前端开发使用 Vite（`npm run dev`），生产构建产物位于 `ai-workspace/build/frontend`。
- 后端 `src/main/resources/static/` 内置了已编译的前端站点，Spring Boot 可独立对外提供页面；`mvn package` 产出可执行 jar。
- Maven 后端构建产物位于 `ai-workspace/build/backend`；论文、截图和测试报告等生成文件统一放入 `ai-workspace/artifacts/`。
- 详细项目结构见 `docs/项目结构说明.md`；按功能模块的实现总结见 `docs/功能模块与实现总结.md`；数据库表结构见 `db/数据库设计说明.md`。
