# 当前项目状态

> 由 CLAUDE.md 引用。版本变更时同步更新此文件。

## 版本号

**v2.5.2**（2026-05-13）— 用户端情绪洞察 + SSE 流式修复 + 文档收口，部署就绪。

## 部署计划

双线推进规划详见 [docs/deployment-plan.md](deployment-plan.md)：

- **路线 A · 开源部署线** — Docker Compose 缺陷修复 + 统一配置 + 安全加固
- **路线 B · Windows EXE 线** — Electron + SQLite + Mock AI 本地演示版

## 测试综合

| 层级 | 测试类型            | 数量                                |
| ---- | ------------------- | ----------------------------------- |
| 前端 | Vitest 单元测试     | 60 用例（10 文件）                  |
| 后端 | Jest 单元测试       | 113 用例（10 模块）                 |
| 后端 | Jest E2E 测试       | 32 用例（覆盖 7 个模块）            |
| E2E  | Playwright 冒烟测试 | 14 用例（smoke 8 + client-flows 6） |

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

| 项目           | 状态                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| Docker Compose | ✅ 三容器编排就绪（MySQL 8.0 + NestJS + Vue/nginx）                                   |
| CI Pipeline    | ✅ GitHub Actions（frontend lint/build/test + backend build/lint/test:unit/validate） |
| 部署文档       | ✅ `docs/deployment.md`                                                               |
| 启动脚本       | ✅ `scripts/start-dev.ps1`（Windows）+ `scripts/setup.sh`（macOS/Linux）              |
| API 接入文档   | ✅ `docs/deepseek-integration.md`                                                     |
| UI/UX Skill    | ✅ `ui-ux-pro-max` 已按官方 CLI 安装到 `.codex/skills/` 与 `.claude/skills/`          |

## 本地 Agent Skill

### UI UX Pro Max

- 安装方式：按官方文档执行 `npm install -g uipro-cli`，再在项目根目录执行 `uipro init --ai codex` 与 `uipro init --ai claude`
- Codex 路径：`.codex/skills/ui-ux-pro-max/`
- Claude Code 路径：`.claude/skills/ui-ux-pro-max/`
- 依赖：Python 3.x（用于 `scripts/search.py` 检索设计数据库）
- 校验：`python .codex/skills/ui-ux-pro-max/scripts/search.py "mental health dashboard" --design-system -p "AI心理健康助手"` 可正常返回设计系统建议

## 新增功能（v2.5.2）— 情绪洞察 + SSE 流式修复 + 部署收口

- **用户端情绪洞察模块** — 新增 `ClientEmotionInsights.vue`，展示当前用户的情绪趋势折线图、情绪分布饼图、压力与睡眠对比柱状图、触发因素分析条形图
- **后端统计接口** — `GET /api/emotion-diary/my/statistics` 返回当前用户的情绪聚合数据（月度趋势、情绪分布、压力睡眠对照、触发因素词频）
- **SSE 流式修复** — 修正 Vue 3 响应式失效问题：`assistantMsg` 改为通过响应式数组获取 reactive proxy，AI 回复实现真正的逐字流式输出
- **AI 头像优化** — 聊天消息中 AI 头像改为项目 logo.png，增强品牌交互感
- **文档收口** — 删除已完成的 `docs/backlog-prompts.md`；README/current-state/task-backlog 与 git 提交历史同步
- **测试修复** — NotificationBell 测试增加 Pinia 实例化；NotificationService 测试注入 Gateway mock

## 新增功能（v2.5.1）

- **UI 主题重构** — 全局主题从暖靛蓝改为暖薰衣草紫渐变（#8B5CF6 → #A78BFA → #C084FC），所有管理端/用户端页面配色统一；按钮统一样式（渐变紫 + 阴影 + 悬停效果），去除所有 Element Plus 默认蓝色边框
- **首页设计** — 新增 `Home.vue`（`/` 路由），含首页大图背景 + 功能入口卡片 + 关于区域
- **登录页优化** — 左侧图片替换为 `logo.png`，文案改为诗意分行排版 + 暖金色高亮；移除重复提交入口，增加 `loading` 防重入，登录成功后使用 `router.replace`
- **侧边栏优化** — 选中态还原紫色，底部插入 `sidebar-scene.jpg` 风景装饰图；管理端导航菜单 active/hover 状态强制紫色
- **资源清理** — 删除废弃 `hero.png` / `vite.svg` / `vue.svg`；新增 `home-bg.jpg` / `sidebar-scene.jpg` / `logo.png`
- **客户端聊天优化** — `ClientChat.vue` 消息气泡样式优化、时间显示优化、加载状态改进
- **客户端布局优化** — `ClientLayout.vue` 导航栏排版调整、过渡动画优化
- **登录稳定性** — 登录页移除重复提交入口，增加 `loading` 防重入，登录成功后使用 `router.replace`，autocomplete 调整为 `username/current-password`
- **知识文章状态操作收口** — 修复 `knowledge.vue` 已删除变量 `isPublish` 引用；按钮规则按 `draft/published/offline/pending_review/rejected` 分流，`offline` 文章支持重新发布
- **管理端知识文章查看** — 新增查看弹窗，详情接口按需拉取正文，正文统一 `DOMPurify.sanitize` 后渲染；非草稿文章可查看但不可编辑
- **审核红点即时刷新** — 新增 `useReviewStore.js` 集中维护待审数量，`Sidebar.vue` 使用 store，审核通过/驳回后立即刷新，保留 60 秒轮询兜底
- **操作原因与用户通知** — 下线/删除普通用户文章时要求输入原因并通知作者；管理员自建文章或本人操作不产生不必要通知
- **性能优化** — 移除 `router.afterEach` 全量预加载；知识文章列表接口排除 `content`，正文仅在查看详情时加载；知识页分类与列表并行请求

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

## API Key 合规提醒

- 绝不提交真实 API Key 到仓库
- 未配置 Key 时自动降级至 Mock 模式，clone 即用
- 自用 Key 只放本地 `.env`（已加入 `.gitignore`）
