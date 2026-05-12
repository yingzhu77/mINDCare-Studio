# 后续待办队列

> 每个窗口独立可执行，只做一个任务。复制提示词到新会话即可开工。

---

## 待办任务

### Window 1 — 新手引导

**边界**

- 只修改前端组件：空状态提示、首次使用引导、操作提示气泡
- 不修改后端接口、不修改 Prisma schema
- 不修改已有业务逻辑，只补充空状态/首次使用时的 UI 反馈

**目标**

用户首次进入以下页面时能看到友好引导或空状态说明，而不是白屏或空表格：
- 情绪日记（无记录时显示"还没有记录，开始记录第一条"）
- 我的投稿（无投稿时显示"还没有投稿"）
- 咨询记录（无会话时显示"还没有咨询记录"）
- 知识文章列表（无文章时提示管理员去创建）

**验收标准**

- 清空数据库后登录，每个列表页显示对应的空状态提示，而不是空白区域
- 空状态提示包含引导操作按钮或文案（如"写第一篇日记"）
- 有数据时正常显示列表，不出现空状态
- `npm run build` 通过

**提示词**

```text
请为以下页面添加新手引导和空状态提示。

边界：
- 只修改 src/views/ 下的前端组件
- 不修改后端、不修改数据库、不修改路由
- 不做新手教程弹窗轮播，只做元素级空状态提示

目标：
1. 情绪日记页（ClientDiary.vue）：无记录时显示空状态插图和"开始记录第一条情绪日记"按钮
2. 我的投稿页（ClientArticles.vue）：无投稿时显示"还没有投稿"和"写文章"按钮
3. 咨询记录页（咨询列表所在组件）：无会话时显示"还没有咨询记录"
4. 知识文章页（管理端 knowledge.vue）：无文章时提示管理员"去创建第一篇知识文章"
5. 管理端 Dashboard：无数据时图表区域显示"暂无数据"占位

验收：
- 清空数据后每个页面显示对应的空状态
- 有数据时正常渲染，互不干扰
- npm run build 通过
```

---

### Window 2 — 移动端适配

**边界**

- 只修改前端 Vue 组件和 CSS
- 不修改后端接口
- 不改变桌面端布局和交互
- 不做独立的移动端路由或 PWA

**目标**

当前 6 个文件有零散 media query，需系统化补充响应式布局，确保核心页面在 375px～768px 宽度下可用。

**验收标准**

- 登录页在手机宽度下表单居中、不溢出
- 管理端侧边栏在窄屏下可折叠为汉堡菜单
- 用户端导航栏在窄屏下不换行错位
- 表格类页面（文章列表、咨询记录）在窄屏下有横向滚动或卡片式降级
- 聊天页面输入框和消息气泡在窄屏下不变形
- `npm run build` 通过

**提示词**

```text
请为以下页面补充移动端响应式适配，目标宽度 375px～768px。

边界：
- 只修改 src/views/ 和 src/components/ 下的 .vue 文件中的样式
- 不修改后端、不修改路由、不修改逻辑
- 不改变桌面端现有布局

目标：
1. 登录/注册页（AuthLayout.vue）：窄屏下表单宽度 100%，上下间距紧凑
2. 管理端布局：侧边栏折叠为汉堡菜单或底部 tab
3. 用户端布局（ClientLayout.vue）：顶部导航换行改为横向滚动或下拉菜单
4. 文章列表/咨询记录等表格页：窄屏下使用卡片布局替代表格，或支持横向滚动
5. 聊天页（ClientChat.vue）：输入框和消息气泡宽度自适应
6. Dashboard 图表：ECharts 容器宽度自适应

验收：
- 浏览器 DevTools 切换到 375px 宽度，核心流程可操作
- 桌面端 1920px 下无样式回归
- npm run build 通过
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
