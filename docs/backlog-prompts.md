# 后续待办队列

> 每个窗口独立可执行，只做一个任务。复制提示词到新会话即可开工。

---

## 待办任务

### Window 2 — 健康助手 UI/UX 专业化重构

**边界**

- 使用已安装的 `ui-ux-pro-max` skill 先产出设计系统，再按设计系统改造页面
- 保留现有业务功能、路由、接口、权限与测试，不做后端业务改动
- 技术栈保持 Vue 3 + Element Plus + Pinia + Vue Router
- 不做营销落地页，首屏仍是实际可用的 SaaS/健康助手工作台

**目标**

在保留原功能基础上，让页面更符合 AI 心理健康助手的专业性、可信度和温和设计感：管理端偏数据与运营效率，用户端偏陪伴、记录、知识阅读与安全感。

**建议设计方向**

- 产品气质：专业心理健康工具，克制、清晰、可信，避免廉价医疗蓝、过度紫色渐变、装饰性大卡片堆叠
- 用户端：更温和的导航、聊天、日记、投稿、知识阅读体验；突出隐私、安全、持续陪伴
- 管理端：更高信息密度、更清晰状态层级、更稳定的表格/筛选/审核工作流
- 可访问性：正文对比度不低于 WCAG AA，明确 focus/hover/loading/empty/error 状态

**验收标准**

- `npm run build` 通过
- `npm run test` 通过
- 核心页面无明显文本溢出、遮挡、按钮错位
- 管理端：Dashboard、知识文章、文章审核、分析页视觉一致
- 用户端：聊天、情绪日记、我的投稿、知识阅读视觉一致
- 不删除现有功能入口，不改变后端 API 契约

**提示词**

```text
$ui-ux-pro-max 请基于当前 Vue3 + Element Plus 项目做健康助手 UI/UX 专业化重构。

边界：
- 保留现有业务功能、路由、接口、权限与测试
- 不做后端业务改动
- 不做营销 landing page，首屏仍是实际可用产品界面
- 管理端偏高效运营，用户端偏心理健康陪伴和安全感

目标：
1. 先扫描现有页面和样式，提出适合 AI 心理健康 SaaS 的设计系统：色彩、字体、间距、组件状态、图表风格、空状态、可访问性规则
2. 按设计系统重构关键页面：
   - 管理端：Dashboard、知识文章、文章审核、数据洞察
   - 用户端：ClientLayout、ClientChat、ClientDiary、ClientArticles、ClientArticleBrowse/Detail
3. 保持 Element Plus 组件体系，但优化视觉层级、表格密度、卡片边界、按钮状态、移动端布局
4. 避免大面积紫色渐变、装饰性 orb/blob、营销化 hero、卡片套卡片
5. 完成后运行 npm run build 和 npm run test

输出：
- 简述设计系统选择和改造范围
- 列出修改文件
- 给出验证结果
```

---

### Window 3 — WebSocket 实时通知

**边界**

- 后端新增 WebSocket 网关，前端新增 WebSocket 客户端连接
- 不修改现有 REST API 的轮询接口
- 保留 REST 轮询作为降级方案

**目标**

当前通知通过 `GET /api/notification/unread-count` 轮询获取，改为 WebSocket 推送未读计数变更，减少冗余请求。

**验收标准**

- 后端 WebSocket 网关在 `/ws/notifications` 路径上可用
- 前端连接后接收到未读计数推送
- 审核文章通过/驳回时，通知计数实时更新
- WebSocket 断线后自动重连
- REST 轮询作为降级方案保留
- `npm run build` 和 `cd server && npm run build` 通过

**提示词**

```text
请实现 WebSocket 实时通知推送，替换当前前端轮询。

边界：
- 后端新增 WebSocket 网关，不修改现有 REST 通知接口
- 前端新增 WS 客户端连接，保留轮询作为降级
- 不修改审核业务逻辑，只在审核完成后触发推送事件

目标：
1. 后端 server/src/notification/ 下新增 NotificationGateway（@WebSocketGateway）
2. 网关监听 /ws/notifications，通过用户 ID room 定向推送
3. 在审核通过/驳回文章的 service 方法中 emit 未读计数变更事件
4. 前端新增 useNotificationSocket composable，连接 WS 并更新 store 中的 unreadCount
5. WS 断线自动重连（间隔 3s，最多 10 次），重连失败回落轮询
6. 前端连接时携带 JWT token 做身份认证

验收：
- 管理端审核文章后，用户端通知铃铛未读计数实时更新（不刷新页面）
- WebSocket 断开后自动重连
- 后端和前端构建通过
- 保留的 REST 轮询在 WS 不可用时仍能工作
```

---

### Window 4 — i18n 国际化

**边界**

- 只修改前端代码，不修改后端
- 当前仅中文，目标增加英文支持
- 不做用户语言偏好持久化（首次检测浏览器语言即可）

**目标**

前端支持中/英文切换，默认跟随浏览器语言。核心页面（登录、导航、聊天、日记）的静态文本外部化。

**验收标准**

- 浏览器设置为英文时，登录页、导航菜单、聊天页、日记页显示英文
- 浏览器设置为中文时，显示中文
- 语言切换按钮在导航栏上可用
- `npm run build` 通过

**提示词**

```text
请为前端添加 i18n 国际化支持，中/英文切换。

边界：
- 只修改前端 src/ 下的文件，不修改后端
- 不做用户语言偏好持久化
- 图表中的中文文案（ECharts）暂不处理

目标：
1. 安装 vue-i18n，在 src/i18n/ 下创建 index.js、zh.js、en.js
2. 外部化以下页面的静态文本：登录/注册、管理端导航菜单、用户端导航菜单、聊天页、情绪日记页
3. 在 ClientLayout.vue 和 AdminLayout 导航栏添加语言切换下拉按钮
4. 初始化时检测 navigator.language 设置默认语言
5. 管理端表格操作列（编辑/删除/审核）保持中文，不强制翻译

验收：
- 切换浏览器语言到 en-US 后刷新，核心页面显示英文
- 语言切换按钮可实时切换
- npm run build 通过
```

---

## 已完成归档

### Window A — 验收收口与测试可信化

**状态**：✅ 已完成（v2.4.1 会话）

**摘要**：修复后端 E2E 依赖本地 seed 数据的问题，修正 docs 中与真实测试结果不一致的数量。

**产出**
- `server/test/app.e2e-spec.ts` — E2E 测试从 7 条扩展到 32 条，覆盖 7 个模块
- `docs/current-state.md` — 测试数量与命令输出一致
- `.claude/CLAUDE.md` — 清理已删除文件的引用

---

### Window B — 客户端知识阅读入口

**状态**：✅ 已完成（v2.4.1 会话）

**摘要**：将已有文章阅读页接入客户端主导航，新增 `/client/knowledge` 和 `/client/knowledge/:id`。

**产出**
- `src/router/index.js` — 新增 `/client/knowledge` 和 `/client/knowledge/:id` 路由
- `src/views/ClientLayout.vue` — 导航栏加入"知识阅读"
- `src/views/ClientArticleBrowse.vue` / `ClientArticleDetail.vue` — 路由感知跳转
- `e2e/client-flows.spec.ts` — 新增文章列表和详情 E2E 用例

---

### Window C — Playwright 稳定性与端口治理

**状态**：✅ 已完成（2026-05-12 会话）

**摘要**：处理 5174/8001 端口残留，本地可复用已有服务，CI 保持干净启动。

**产出**
- `playwright.config.ts` — `--strictPort`、`reuseExistingServer: !CI`、Mock AI 注释
- `docs/current-state.md` — 新增 Playwright 本地运行说明章节
- `README.md` — 验证章节新增 Playwright E2E 测试指引

---

## Test Plan

### 单窗口验收（每次执行一个 Window 后验证）

| 检查项 | 命令 |
|--------|------|
| 前端构建 | `npm run build` |
| 后端构建 | `cd server && npm run build` |
| 前端单元测试 | `npm run test` |
| 后端单元测试 | `cd server && npm run test:unit` |
| 后端 E2E 测试 | `cd server && npm run test:e2e` |
| Playwright E2E | `npx playwright test` |
| API Key 泄露检查 | `git grep -n "DEEPSEEK_API_KEY=sk-"` 不应返回真实密钥 |

### 全局回归（全部 Window 完成后）

1. 克隆新目录，执行 `scripts/setup.sh` 或 `scripts/start-dev.ps1` 确认一键启动正常
2. 管理端全流程：登录 → Dashboard → 文章管理 → 审核 → 通知
3. 用户端全流程：登录 → AI 聊天 → 情绪日记 → 文章投稿 → 知识阅读
4. 权限隔离：user 角色无法访问管理端路由；未登录自动跳转登录页
5. 构建产物：`npm run build` + `cd server && npm run build` 无报错

---

## Assumptions

- 每个 Window 完成后应由人工验收 Test Plan 中的对应项，再进入下一个 Window
- "一个窗口一个任务"原则：任何 Window 如果发现需要顺手修复的问题，记入 backlog 而不是现场扩范围
- 后续任务追加同样遵循此格式：边界、目标、验收标准、提示词
