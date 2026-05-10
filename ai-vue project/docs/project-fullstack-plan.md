# AI 心理健康管理平台开源化与 TypeScript 全栈实现计划书

生成日期：2026-05-10（最后更新）

## 1. 项目目标

本项目长期目标是做成偏 Web SaaS 形态的开源项目，而不只是一个本地演示后台。项目应具备清晰的前后端边界、统一类型契约、可复制的本地启动流程、可扩展的用户体系、完整的业务闭环和基础工程治理。

最终形态：

- 前端：Vue3 + Vite + Element Plus + Pinia。
- 后端：TypeScript + NestJS + Prisma + MySQL。
- AI：后端代理 DeepSeek API，支持流式对话、分析结果落库和失败兜底。
- 数据库：开发期可使用 SQLite，主目标数据库为 MySQL。
- 开源交付：README、LICENSE、CONTRIBUTING、CHANGELOG、启动脚本、环境模板、示例数据和截图齐全。

## 2. 当前状态

版本：**v2.3.1**（2026-05-10）— Phase 0-8 ✅ + @CurrentUser 修复

### 前端（Vue3 + Vite + Element Plus + Pinia）

- **管理端**：登录、注册、Dashboard（含 ECharts 趋势图：情绪月均/咨询量/文章发布）、知识文章 CRUD + 分类管理、文章审核队列（通过/驳回+原因）、咨询记录（含会话详情弹窗+AI 摘要）、情绪日记（含 AI 分析关联）、用户管理。
- **用户端**：`ClientLayout`（顶部导航 + 用户下拉退出 + 通知铃铛轮询）、`ClientChat`（SSE 流式 AI 聊天 + 快捷提问 + 会话侧边栏 + 删除/导出）、`ClientDiary`（情绪日记 CRUD + 滑块评分）、`ClientArticles`（文章投稿列表 + 创建/编辑/提交审核）。
- **认证体系**：`useAuthStore`（token/user/role 持久化 + Pinia persist）、角色路由守卫（`/back/*` 仅 admin、`/client/*` 允许 admin+user）、登录按角色跳转。
- **工程优化**：统一日期格式化 `src/utils/date.js`、搜索筛选栏 CSS 防折叠、路由切换 `:key` 强制重渲染、封面上传 `uploadResult.url` 取值修复、统一日志通道 `src/utils/logger.js`（全部视图已迁移）。

### 后端（NestJS + Prisma + SQLite）

- **全部 7 个核心实体**：Prisma schema、migration、seed 完备。Seed 数据增强：管理员 + 测试用户、7 篇知识文章（含不同状态）、2 条咨询会话 + 消息、3 条情绪日记。
- **统一基础设施**：`TransformInterceptor`（响应包装）、`AllExceptionsFilter`（异常过滤）、`JwtAuthGuard`（同时兼容 `token` 头和 `Authorization: Bearer`）、`RolesGuard`、全局 `ValidationPipe`（whitelist + transform）。
- **认证模块**：`POST /user/login`、`POST /user/register`、`GET /user/me`。
- **管理端业务**：知识分类/文章 CRUD + 状态管理（draft/pending_review/published/rejected/offline）、咨询会话分页/详情/消息、情绪日记分页/删除、Dashboard 统计、文件上传、用户分页/启禁。
- **用户端业务**：`POST /chat/send`（SSE 流式）、情绪日记 CRUD、文章投稿 CRUD + 提交审核（`/api/client/article/*`）。
- **AI 模块**：DeepSeek 客户端 + 系统提示词 + mock AI 模式（无需 API Key 即可演示）。分析结果落库 + 缓存，重复打开不重复调用模型。
- **分析模块**：`POST/GET /analysis/emotion-diary/:id`、`POST/GET /analysis/chat-session/:id`。分析失败不阻塞业务。
- **Swagger**：`/api/docs` 已配置，标题/描述/版本 + Bearer Auth + token 头双重认证。
- **单元测试**：Jest + 52 用例覆盖 notification、analysis、chat、emotion-diary 共 5 个模块。
- **E2E 测试**：Jest + supertest，覆盖 `GET /health`、`POST /user/login`、用户会话管理。
- **组件测试**：Vitest + 41 用例，覆盖 utils 和 DashboardCharts、NotificationBell、TableSearch 组件。
- **Playwright E2E**：3 冒烟测试覆盖登录页加载、管理员登录→Dashboard、未登录重定向。

### 已修复的关键问题

- 注册角色越权漏洞（拒绝客户端传入 `role`）
- 上传控制器同时允许 admin 和 user
- SSE 聊天 60s 超时保护
- 咨询记录 N+1 查询消除（`previewText` 方案）
- 死文件清理（`consultations.vue`）
- 知识文章分类显示"未分类" → 改为 `row.category?.categoryName`
- 时间统一格式化 → 创建 `src/utils/date.js`
- 路由切换页面空白 → `:key="$route.fullPath"`
- 搜索筛选栏折叠 → TableSearch CSS 加固
- 封面上传不显示 → `uploadResult.url` 取值
- 状态筛选/发布下线按钮无效 → 字符串状态匹配
- 文章创建硬编码 `authorId=1` → `@CurrentUser('sub')` 真实用户
- 管理员创建文章默认 draft → 默认 `published`
- `@CurrentUser('userId')` 误用修复 → `@CurrentUser('sub')`，影响 knowledge + notification 模块（导致 authorId/reviewerId 为 undefined、通知数据泄漏）
- logs.vue 标题 CSS transform scale hack 移除 → 改用标准 font-size

### v2.0 收口阶段已修复

| 类型 | 问题 | 状态 |
|------|------|------|
| 安全 | ClientChat.vue XSS 风险（`v-html` + 正则解析） | ✅ 改用 marked + DOMPurify |
| 代码 | emotional.vue 过度防御式编程（30+ 字段 fallback） | ✅ 收敛到已知后端字段 |
| 代码 | `console.error` 散落 15+ 处 | ✅ 全部迁移至 logger.js（9 文件，15+ 处） |
| 测试 | 前端零测试 | ✅ Vitest 骨架搭建完成，33 用例通过 |
| 体验 | 各页面空状态不一致 | ✅ 已统一 el-empty，修复静默 catch |

### 当前遗留问题

| 类型 | 问题 | 影响 |
|------|------|------|
| 性能 | wangEditor chunk ~800kB（已代码分割） | 不影响首屏 |
| 性能 | ECharts ~1.1MB 合入 Dashboard chunk（首次加载） | 仅影响管理端首屏加载 |
| 缺失 | 真实 DeepSeek API Key 验证 | Mock 模式已可用，无需 Key |
| 缺失 | i18n 国际化支持 | 仅中文界面 |
| 修复 | @CurrentUser('userId') 误用（knowledge + notification） | 已修复，见"已修复的关键问题" |
| 已完成 | 技术债务优化项（XSS 统一 / N+1 查询 / 事务保护 等） | 全部 11 项已在 v2.3.1 中解决 |

### 当前索引覆盖

| 表 | 索引 | 覆盖查询 |
|----|------|---------|
| knowledge_articles | `[status]` | 管理端按状态筛选审核队列 |
| knowledge_articles | `[authorId]` | 用户查询自己的文章列表 |
| ai_analysis_results | `[bizType, bizId]` | 按业务类型+ID 查找分析结果（情绪日记/会话分析） |
| chat_messages | `[sessionId]` | 按会话查询消息列表 |
| notifications | `[userId, isRead]` | 查询用户未读通知 |

其余外键字段（`knowledge_articles.categoryId`、`chat_sessions.userId`、`emotion_diaries.userId` 等）由 Prisma 自动建立索引。

## 3. 技术栈

### 当前技术栈

- **前端**：Vue 3 + Vite 5 + Element Plus + Pinia + Vue Router
- **后端**：NestJS 10 + Prisma 5 + SQLite（开发）/ MySQL（目标）
- **AI**：DeepSeek API 代理（mock 模式可用）
- **认证**：JWT（@nestjs/jwt），兼容 `token` 头和 `Authorization: Bearer`
- **文档**：Swagger（`/api/docs`）
- **测试**：Jest + supertest（E2E）

## 4. 项目架构

```text
ai-vue project/
  src/                       # Vue3 前端
    api/
      admin.js
      client.js
    components/
    router/
    store/
    views/

  server/                    # NestJS 后端主线
    prisma/
      schema.prisma
      seed.ts
      migrations/
    src/
      main.ts
      app.module.ts
      common/                # 过滤器、拦截器、守卫、装饰器
      config/
      auth/
      users/
      knowledge/
      client-article/
      chat/
      emotion-diary/
      analysis/
      analytics/
      upload/
      ai/
    test/
    package.json
    tsconfig.json
    .env.example

  docs/
  scripts/
```

## 5. 统一接口约定

前端继续使用 `/api` 作为请求前缀。后端同时保留不带 `/api` 的核心路径兼容能力，便于 Swagger 和直接调用。

统一响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 0,
    "currentPage": 1,
    "size": 10
  }
}
```

错误响应：

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null
}
```

认证约定：

- 前端请求头继续兼容 `token`。
- 后端同时支持标准 `Authorization: Bearer <token>`。
- 管理端 `/back/*` 需要 `admin` 角色。
- 用户端 `/client/*` 需要 `user` 或 `admin` 角色。

## 6. 数据模型

### 6.1 users

- `id` / `username` / `email` / `passwordHash`
- `role`：`admin` / `user`
- `status`：启用、禁用
- `createdAt` / `updatedAt`

### 6.2 knowledge_categories

- `id` / `categoryName` / `parentId` / `sortOrder` / `status`
- `createdAt` / `updatedAt`

### 6.3 knowledge_articles

- `id` / `title` / `categoryId` / `authorId` / `summary` / `tags` / `coverImage` / `content`
- `readCount` / `rejectReason` / `publishedAt`
- `status`：`draft` / `pending_review` / `published` / `rejected` / `offline`
- `createdAt` / `updatedAt`

### 6.4 chat_sessions

- `id` / `sessionId` / `userId` / `userName` / `startTime` / `endTime`
- `messageCount` / `emotionTags` / `aiSummary` / `riskLevel` / `status`
- `createdAt` / `updatedAt`

### 6.5 chat_messages

- `id` / `sessionId` / `role` / `content` / `messageTime` / `rawPayload`
- `createdAt`

### 6.6 emotion_diaries

- `id` / `userId` / `userName` / `diaryDate` / `moodScore`
- `sleepQuality` / `stressLevel` / `dominantEmotion` / `emotionTriggers` / `diaryContent`
- `createdAt` / `updatedAt`

### 6.7 ai_analysis_results

- `id` / `bizType`（emotion_diary / chat_session）/ `bizId`
- `mainEmotion` / `emotionIntensity` / `emotionNature` / `riskLevel` / `riskDescription`
- `professionalAdvice` / `improvementSuggestions` / `summary` / `emotionTags`
- `modelName` / `rawResponse` / `status`（pending / success / failed）/ `errorMessage`
- `createdAt` / `updatedAt`

## 7. 后端模块

### 7.1 common

统一响应包装、全局异常过滤、请求日志、分页 DTO、当前用户装饰器、JWT Guard 和角色 Guard。

### 7.2 auth

登录、注册、密码哈希、JWT 签发、当前用户读取。
- `POST /user/login`
- `POST /user/register`
- `GET /api/user/me`

### 7.3 users

管理员分页查看用户、启用和禁用用户。
- `GET /api/user/page`
- `PUT /api/user/:id/status`

### 7.4 knowledge

知识分类与文章管理、管理员审核和上下线。
- `GET /api/knowledge/category/tree`
- `GET /api/knowledge/article/page`
- `POST /api/knowledge/article`
- `PUT /api/knowledge/article`
- `GET /api/knowledge/article/:id`
- `DELETE /api/knowledge/article/:id`
- `PUT /api/knowledge/article/:id/status`

### 7.5 client-article

普通用户创建草稿、提交审核、查看投稿状态。
- `GET /api/client/article/page`
- `POST /api/client/article`
- `PUT /api/client/article/:id`
- `PUT /api/client/article/:id/submit`

### 7.6 chat

管理端查询咨询记录，用户端 AI 对话（SSE 流式）。
- `GET /api/psychological-chat/sessions`
- `GET /api/psychological-chat/sessions/:sessionId`
- `GET /api/psychological-chat/sessions/:sessionId/messages`
- `GET /api/psychological-chat/session/:sessionId/emotion`
- `POST /api/chat/send`

### 7.7 emotion-diary

管理端查看和删除情绪日记，用户端创建和查看自己的日记。
- `GET /api/emotion-diary/admin/page`
- `DELETE /api/emotion-diary/admin/:id`
- `POST /api/emotion-diary`
- `GET /api/emotion-diary/my/page`

### 7.8 analysis

触发和查询 AI 分析结果（情绪日记 / 咨询会话），失败不阻塞业务。
- `POST/GET /api/analysis/emotion-diary/:id`
- `POST/GET /api/analysis/chat-session/:id`

### 7.9 analytics

Dashboard 统计。
- `GET /api/data-analytics/overview`

### 7.10 upload

封面和附件上传，限制文件大小和类型。
- `POST /api/file/upload`

## 8. 前端路由

```text
/auth/login
/auth/register

/client/chat
/client/articles
/client/articles/create
/client/articles/:id/edit

/back/dashboard
/back/knowledge
/back/article-review
/back/consultations
/back/emotion-diary
/back/users
```

## 9. DeepSeek 接入方案

### 9.1 聊天流程

```text
ClientChat.vue
  -> POST /api/chat/send
  -> ChatService 保存用户消息
  -> 读取最近上下文
  -> DeepSeek stream 调用
  -> SSE token 返回前端
  -> 流结束后保存助手完整回复
  -> 更新 chat_sessions
```

### 9.2 SSE 事件格式

```json
{"type":"token","content":"你好"}
{"type":"done","sessionId":"abc-123","messageId":42}
{"type":"error","message":"AI 服务暂时不可用"}
```

### 9.3 心理健康安全边界

系统提示词必须包含：
- 不做医疗诊断。
- 不提供处方和治疗方案。
- 对自伤、自杀等高风险内容给出寻求专业帮助和紧急服务的建议。
- 回复保持温和、共情、克制。
- 需要标记模型生成内容的非专业诊断属性。

### 9.4 AI 调用兜底

- DeepSeek API Key 只存在后端 `.env`。
- 超时返回可读错误，不阻塞业务数据保存。
- 支持 mock AI 模式，便于无 key 演示。
- 分析结果写入 `ai_analysis_results`。
- 列表页只读数据库，不批量实时调用模型。

## 10. 文章审核流程

状态机：

```text
draft -> pending_review -> published
draft -> pending_review -> rejected -> draft
published -> offline -> published
```

权限：

| 操作 | 普通用户 | 管理员 |
| --- | --- | --- |
| 创建草稿 | 可以 | 可以（直接发布） |
| 编辑自己的草稿 | 可以 | 可以 |
| 提交审核 | 可以 | 不需要 |
| 审核通过 | 不可以 | 可以 |
| 驳回 | 不可以 | 可以 |
| 下线 | 不可以 | 可以 |
| 删除文章 | 仅自己的草稿 | 可以 |
| 查看全部文章 | 不可以 | 可以 |

## 11. 分阶段交付

### Phase 0：TS 后端脚手架 ✅

NestJS + Prisma + SQLite，7 实体 migration + seed，统一响应/异常过滤/JWT，健康检查/登录/注册。

### Phase 1：管理端页面真实化 ✅

知识文章 CRUD + 分类树、咨询记录 + 消息列表、情绪日记 + 删除、Dashboard 统计。全部接入 NestJS 后端。

### Phase 2：用户体系 + 用户端基础 ✅

`useAuthStore` + 角色守卫 + 登录按角色跳转、`ClientLayout`、`ClientChat`（SSE）、`ClientDiary`、用户端文章投稿。

### Phase 3：DeepSeek 聊天 ✅

`POST /api/chat/send` SSE 流式输出，消息自动落库，mock AI 模式。

### Phase 4：AI 分析 ✅

情绪日记和会话分析，结果落库 + 缓存，失败不阻塞业务，前端展示分析结果。

### Phase 5：文章审核闭环 ✅

`ArticleReview.vue` 审核页面，通过/驳回+原因，状态机完整，用户端驳回编辑重新提交。

### Phase 6：开源化准备 + 工程提效 ✅

LICENSE、CONTRIBUTING、CHANGELOG、启动脚本、Swagger、E2E 测试、Seed 增强、README。

## 12. 后续工作优先级

### P0 — 速率限制与安全加固 ✅

已接入 `@nestjs/throttler` 全局限流（120 req/min）、登录（5/min）、注册（3/min）、AI 聊天（20/min）、上传（10/min）。文件上传类型白名单 + 10MB 限制。

### P1 — MySQL 迁移 ✅

`prisma/mysql/schema.prisma` 已创建，包含完整的 MySQL 类型注解（`@db.VarChar`、`@db.Text`、`@db.LongText`）、索引优化。`.env.production` 生产环境模板就绪。使用 `--schema` 标志切换 SQLite（dev）/ MySQL（prod）。

### P2 — Docker Compose 部署 ✅

| 文件 | 说明 |
|------|------|
| `server/Dockerfile` | NestJS multi-stage 构建 + 入口脚本自动迁移 |
| `Dockerfile`（根目录） | Vue3 / Vite 构建 + Nginx 静态服务 |
| `docker-compose.yml` | MySQL 8.0 + 后端 + 前端三容器编排 |
| `nginx.conf` | 前端 SPA + API 反向代理 + SSE 支持 |
| `.dockerignore` | 前端/后端构建上下文排除 |

### P3 — 构建优化 ✅

`ArticleEditor`（wangEditor）已通过 `defineAsyncComponent` 动态导入实现代码分割，独立 chunk（~801kB）不阻塞首屏加载。wangEditor 已设为中文界面（`i18nChangeLanguage('zh-CN')`）。

### P4 — 审核结果通知 ✅

| 层 | 实现 |
|------|------|
| 后端 | `Notification` 模型 + 迁移 + `notification` 模块（CRUD + 未读计数） |
| 后端 | `KnowledgeService.updateArticleStatus` 审核时自动创建通知 |
| 前端 | `NotificationBell.vue` 组件（铃铛图标 + 未读徽标 + 下拉面板） |
| 前端 | `ClientLayout` 头部集成通知铃铛，每 30 秒轮询未读数量 |
| API | `GET/PUT /api/notification/*` 支持列表、标记已读、全部已读 |

### P5 — 用户端聊天历史管理 ✅

| 层 | 实现 |
|------|------|
| 后端 | `GET /api/chat/sessions/my` — 用户端会话列表（带最后消息预览） |
| 后端 | `DELETE /api/chat/session/:sessionId` — 级联删除会话/消息/分析结果 |
| 后端 | `GET /api/chat/session/:sessionId/export` — 导出会话为 JSON |
| 后端 | 校验用户归属，越权返回 404 |
| 前端 | `ClientChat.vue` 新增 280px 侧边栏，显示 50 条最近会话 |
| 前端 | 每个会话项悬停显示删除/导出按钮 |
| 前端 | 删除确认弹窗，导出使用浏览器原生 download API |
| 迁移 | Prisma 新增 `ChatMessage[sessionId]`、`ChatSession[userId]` 索引 |
| 测试 | E2E 覆盖会话列表/导出/删除/越权拒绝 |

### P5 — 用户端聊天历史管理 ✅

**目标**：用户端缺少对聊天会话的自主管理能力。实现删除和导出功能。

**实现方案**：
1. 后端：`DELETE /api/chat/session/:sessionId` — 删除会话（Prisma 事务级联删除消息 + 分析结果）
2. 后端：`GET /api/chat/session/:sessionId/export` — 导出会话（返回 JSON 格式）
3. 后端：`GET /api/chat/sessions/my` — 用户端自己的会话列表（分页 + 最近消息预览）
4. 前端：`ClientChat.vue` 侧边栏会话列表（280px）+ 删除确认弹窗 + 导出下载按钮
5. 使用浏览器原生 download API 实现文件导出，不引入额外 npm 包

**边界**：
- 不引入额外前端构建工具或状态管理库
- 不修改现有消息流或 SSE 聊天逻辑
- 删除仅限用户自己的会话，后端校验 `userId` 归属
- 导出格式为 JSON（含完整消息和时间戳）

**迁移辅助**：
- Prisma 索引新增：`ChatMessage[sessionId]`、`ChatSession[userId]`
- E2E 测试覆盖：会话列表 / 导出 / 删除 / 越权拒绝

---

## 15. v2.0 收口阶段 ✅

**目标达成**：从"功能完整"进入"质量可信"。

| 优先级 | 内容 | 状态 |
|--------|------|------|
| P0 — XSS 安全修复 | marked + DOMPurify 替代正则渲染 | ✅ 完成 |
| P1 — 代码杂音清理 | emotional.vue 字段收敛、logger.js 统一异常通道 | ✅ 完成 |
| P2 — 测试骨架搭建 | Vitest + 4 个测试文件、33 用例 | ✅ 完成 |
| P3 — 体验统一 | el-empty 空状态、catch 日志输出 | ✅ 完成 |

---

## 16. Phase 7 — 生产就绪 + 产品体验 ✅

**目标**：从"质量可信"进入"可展示、可部署、可维护"。

| 优先级 | 内容 | 状态 |
|--------|------|------|
| P0 | Dashboard 图表增强：ECharts 趋势图（情绪月均/咨询量/文章发布） | ✅ 完成 |
| P1 | GitHub Actions CI：push/PR 自动 lint + build + test | ✅ 完成 |
| P2 | 后端测试深化：notification + analysis 单元测试（15 用例） | ✅ 完成 |
| P3 | 生产部署文档：Docker + SSL + 备份 + 安全组 | ✅ 完成 |
| P4 | 遗留 console.error 迁移：9 文件 15+ 处替换为 logger.error | ✅ 完成 |

## 17. Phase 8 — 体验完善 + 质量深化 ✅

**目标达成**：从"功能可部署"进入"体验可推荐"。

| 优先级 | 内容 | 状态 |
|--------|------|------|
| P0 | 前端组件测试覆盖：DashboardCharts、NotificationBell、TableSearch（8 用例） | ✅ 完成 |
| P1 | 后端测试深化：chat + emotion-diary 模块（27 新用例） | ✅ 完成 |
| P2 | Playwright E2E 骨架：3 冒烟测试 | ✅ 完成 |
| P3 | 管理端搜索/筛选体验统一：emotional.vue 新增搜索 + logs.vue 统一为 TableSearch | ✅ 完成 |

### 测试综合

| 层级 | 测试类型 | 数量 |
|------|---------|------|
| 前端 | Vitest 单元测试 | 41 用例（4 utils + 3 组件） |
| 后端 | Jest 单元测试 | 52 用例（5 模块） |
| E2E | Playwright 冒烟测试 | 3 用例 |

### Phase 8 交付物

- **P0**: DashboardCharts.test.js（3 用例）、NotificationBell.test.js（2 用例）、TableSearch.test.js（3 用例），新增 vitest config（css: true + deps.inline element-plus）
- **P1**: chat.service.spec.ts（14 用例）、emotion-diary.service.spec.ts（13 用例），mock Prisma 测试模式
- **P2**: playwright.config.ts（双 webServer、独立端口） + e2e/smoke.spec.ts（3 冒烟测试）
- **P3**: emotional.vue 新增用户名搜索；logs.vue 手写搜索迁移至 TableSearch 组件

---

## 19. 待后续窗口 — 技术债务与架构优化

以下项目来自 v2.3.1 独立复查，**已在 v2.3.1 全部解决**。

### P0 — 核心稳定性 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| SessionDetailDialog XSS 统一 | ✅ | 已使用 DOMPurify |
| UploadService 异步化 | ✅ | 已改用 `fs/promises.writeFile` |
| 异常过滤 HTTP 日志 | ✅ | HttpException 已按级别记录日志 |
| 通知 DTO 校验 | ✅ | 已使用 `PaginationDto` |

### P1 — 数据一致性与性能 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| 管理端咨询列表 N+1 消除 | ✅ | 后端单次 `findMany` + `include`，无 N+1 |
| 分析结果事务保护 | ✅ | 已包装 `$transaction` |
| `emotionTags` 序列化统一 | ✅ | 新增 `json-helper.ts` 统一解析 |

### P2 — 架构长期可维护 ✅

| 项目 | 状态 | 说明 |
|------|------|------|
| 用户端情绪日记删除 API | ✅ | 独立 `DELETE /api/emotion-diary/:id` + client.ts |
| SQLite 原始 SQL 迁移兼容 | ✅ | 改为 Prisma 查询 + 内存聚合 |
| 路由守卫 token 读取源统一 | ✅ | 统一使用 Pinia store |

## 18. 验证策略

```powershell
# 前端构建
npm run build

# 后端
cd server
npm run build
npm run test
npx prisma migrate status
```

关键手动流程：
- 注册 -> 登录 -> 进入用户端。
- 管理员登录 -> 进入后台。
- 用户聊天 -> 会话落库 -> 后台咨询记录可见。
- 用户投稿 -> 管理员审核 -> 知识库展示。
- 创建情绪日记 -> 触发分析 -> 详情展示分析结果。

## 19. 风险与控制

- **范围膨胀**：每个 Phase 必须有可运行验收结果。
- **API 契约漂移**：后端优先兼容 `src/api/admin.js` 已有接口。
- **数据迁移混乱**：始终使用 Prisma migration。
- **AI 成本**：结果落库、列表只读、mock 模式兜底。
- **心理健康合规**：系统提示词 + 前端提示明确"不提供医疗诊断"。
- **开源安全**：提交前检查 `.env`、数据库文件、API Key。
