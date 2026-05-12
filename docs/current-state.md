# 当前项目状态

> 由 CLAUDE.md 引用。版本变更时同步更新此文件。

## 版本号

**v2.5.0**（2026-05-13）— 文章审核系统重构 + 管理端分析页 + 用户端知识导航 + 前端 TS 化。

## 测试综合

| 层级 | 测试类型 | 数量 |
|------|---------|------|
| 前端 | Vitest 单元测试 | 60 用例（10 文件） |
| 后端 | Jest 单元测试 | 111 用例（10 模块） |
| 后端 | Jest E2E 测试 | 32 用例（覆盖 7 个模块） |
| E2E | Playwright 冒烟测试 | 14 用例（smoke 8 + client-flows 6） |

### Playwright E2E 本地运行

**前置条件：** 后端已构建（`cd server && npm run build`），依赖已安装（`npm install` + `cd server && npm install`）。

```bash
# 运行全部 E2E 测试（自动启动前后端服务）
npx playwright test

# 仅运行冒烟测试
npx playwright test e2e/smoke.spec.ts

# 仅运行客户端流程测试
npx playwright test e2e/client-flows.spec.ts

# UI 调试模式
npx playwright test --ui
```

**端口管理：**

- 前端端口 `5174`，后端端口 `8001`
- 本地运行（无 `CI` 环境变量）时 `reuseExistingServer: true`：若已有 dev server 占用端口则直接复用，否则自动启动
- CI 环境始终干净启动；`--strictPort` 确保端口被占用时报错明确
- 端口被占用时的典型错误：Vite 报 `Port 5174 is in use`，Node 报 `EADDRINUSE`
- 如需释放端口：`npx kill-port 5174 8001` 或手动终止占用进程

**AI 依赖：** Playwright 配置不设 `DEEPSEEK_API_KEY`，后端自动降级为 Mock AI 模式，无需外部服务即可完整运行。

## 基础设施

| 项目 | 状态 |
|------|------|
| Docker Compose | ✅ 三容器编排就绪（MySQL 8.0 + NestJS + Vue/nginx） |
| CI Pipeline | ✅ GitHub Actions（frontend lint/build/test + backend build/lint/test:unit/validate） |
| 部署文档 | ✅ `docs/deployment.md` |
| 启动脚本 | ✅ `scripts/start-dev.ps1`（Windows）+ `scripts/setup.sh`（macOS/Linux） |
| API 接入文档 | ✅ `docs/deepseek-integration.md` |

## 新增功能（v2.5.0）

- **文章审核系统重构** — 新增 `KnowledgeArticleRevision` 修订表，合并主文章+修订的统一审核队列，支持修订版提审/审核/拒绝；管理端 `ArticleReview.vue` 全面重写，审核列表分页+统一状态管理
- **前端 API 层 TypeScript 化** — `admin.ts` 全部接口类型化，新增 `ReviewArticle` 类型；`types.ts` 补充 `KnowledgeArticle` 字段（`role`、`hasPendingRevision`）
- **管理端分析页** — `/back/analytics` 阅读排行 Top 10 + 风险分布饼图 + SEIQ 评分统计
- **用户端知识阅读导航** — `ClientLayout.vue` 导航栏集成"知识阅读"入口，路由 `/client/knowledge` `/client/knowledge/:id`
- **文章状态过渡约束** — 主文章状态过渡规则化（draft→published、published→offline 等），审核状态必须走审核专用接口
- **删除/下线通知作者** — 管理员删除或下线文章时自动通知作者
- **路由性能优化** — 移除非阻塞预加载（`router.afterEach`），减少单页应用后台流量
- **新增文件**：`Analytics.vue`、`useReviewStore.js`
- **删除清理**：移除 `DeepSeek API 最小接入注意清单.md`、`docs/ai-handoff.md`

### 缺陷修复

- **日记保存 400 错误** — `emotionTriggers` 前端发送 `string[]` 而后端 DTO 要求 `string`，发送前 `join(',')` 转换
- **聊天"网络连接失败"** — `ClientChat.vue` 直连 `fetch('http://127.0.0.1:8000/api/chat/send')` 绕过了 Vite 代理，改走相对路径 `/api/chat/send`

## 新增功能（v2.4.1）

- 后端 E2E 测试从 7 条扩展到 32 条，覆盖 knowledge / emotion-diary / analytics / upload / client-article
- 跨平台启动脚本 `scripts/setup.sh`（bash），macOS/Linux 一键开发启动
- DeepSeek API 接入文档 `docs/deepseek-integration.md`，含配置/模型/故障排查
- 管理端分析页 `/back/analytics`：文章阅读排行 Top 10 + 风险分布饼图
- 缺陷修复：
  - 日记保存：`emotionTriggers` 数组→字符串转换，修复 400 验证错误
  - 聊天连接：去掉直连 fetch，改走 Vite 代理，修复跨站/后端未启动时的"网络连接失败"

## 当前不做什么

- 不引入 WebSocket 实时通知
- 不做系统化移动端适配
- 不做 i18n 国际化
- 不动 ECharts 图表样式
- 不动已有的 Docker Compose / MySQL schema 配置

## API Key 合规提醒

- 绝不提交真实 API Key 到仓库
- 未配置 Key 时自动降级至 Mock 模式，clone 即用
- 自用 Key 只放本地 `.env`（已加入 `.gitignore`）
