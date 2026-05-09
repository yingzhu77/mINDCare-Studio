# AI 心理健康管理平台开源化与 TypeScript 全栈实现计划书

生成日期：2026-05-08

## 1. 项目目标

本项目长期目标是做成偏 Web SaaS 形态的开源项目，而不只是一个本地演示后台。项目应具备清晰的前后端边界、统一类型契约、可复制的本地启动流程、可扩展的用户体系、完整的业务闭环和基础工程治理。

最终形态：

- 前端：Vue3 + Vite + Element Plus + Pinia。
- 后端：TypeScript + NestJS + Prisma + MySQL。
- AI：后端代理 DeepSeek API，支持流式对话、分析结果落库和失败兜底。
- 数据库：开发期可使用 SQLite，主目标数据库为 MySQL。
- 开源交付：README、LICENSE、CONTRIBUTING、CHANGELOG、启动脚本、环境模板、示例数据和截图齐全。

## 2. 当前状态

当前项目已完成：

### 前端（Vue3 + Vite + Element Plus + Pinia）

- **管理端**：登录、注册、Dashboard、知识文章 CRUD、咨询记录（含会话详情弹窗）、情绪日记（含分析关联）、用户管理。
- **用户端**：`ClientLayout`（顶部导航 + 用户下拉退出）、`ClientChat`（SSE 流式 AI 聊天 + 快捷提问）、`ClientDiary`（情绪日记 CRUD + 滑块评分）、`ClientArticles`（文章投稿列表 + 创建/编辑）。
- **认证体系**：`useAuthStore`（token/user/role 持久化）、角色路由守卫（`/back/*` 仅 admin、`/client/*` 允许 admin+user）、登录按角色跳转。
- **接口封装**：`src/api/admin.js`（管理端全部接口）、`src/api/client.js`（用户端 API）。
- **工具层**：`src/utils/request.js`（统一请求/响应拦截）、`src/utils/sessionMessage.js`（消息归一化、预览提取）。

### 后端（NestJS + Prisma + SQLite/MySQL）

- **全部 7 个核心实体**：Prisma schema、migration、seed 完备。
- **统一基础设施**：`TransformInterceptor`（响应包装）、`AllExceptionsFilter`（异常过滤）、`JwtAuthGuard`（同时兼容 `token` 头和 `Authorization: Bearer`）、`RolesGuard`、全局 `ValidationPipe`。
- **认证模块**：`POST /user/login`、`POST /user/register`、`GET /user/me`。
- **管理端业务**：知识分类/文章 CRUD、咨询会话查询/详情/消息、情绪日记管理、Dashboard 统计、文件上传、用户分页/启禁。
- **用户端业务**：`POST /chat/send`（SSE 流式）、`GET /emotion-diary/my/page`、`POST/GET/PUT /client/article/*`（投稿 CRUD+提交审核）。
- **AI 模块**：DeepSeek 客户端 + 系统提示词 + mock AI 模式（无需 API Key 即可演示）。
- **分析模块**：`POST/GET /analysis/emotion-diary/:id`、`POST/GET /analysis/chat-session/:id`。

### 已修复/优化的工程问题

- 注册角色越权漏洞（拒绝客户端传入 `role` 字段）
- 上传控制器同时允许 admin 和 user
- SSE 聊天 60s 超时保护
- 咨询记录页 N+1 查询消除（后端返回 `previewText`）
- `consultations.vue` 死文件清理
- 创建 `server/.env.example` 环境模板

### 当前主要缺口

- **AI 分析未接入前端**：情绪日记详情和咨询记录详情尚未展示 AI 分析结果。
- **文章审核闭环不完整**：管理员缺少专门的待审核队列和驳回/通过操作页面。
- **开源化基础文件**：缺少 LICENSE、CONTRIBUTING、CHANGELOG、启动脚本。
- **前端注册页缺少密码最小长度校验**（服务端要求 6 位，前端仅验证 `required`）。
- **Swagger/OpenAPI 未配置**（依赖已安装但未启用）。
- **服务端测试为空**。

## 3. 技术决策

### 3.1 后端改用 TypeScript

项目目标转向长期 Web SaaS 开源项目，因此后端主线从 FastAPI 调整为 TypeScript。

推荐组合：

- NestJS：模块化、依赖注入、Guard、Pipe、Interceptor、Swagger 支持完善。
- Prisma：schema、migration、seed 和类型生成适合开源协作。
- MySQL：项目目标数据库。
- SQLite：仅作为本地快速演示可选数据库。
- Zod 或 class-validator：请求参数校验。
- jose 或 jsonwebtoken：JWT。
- undici 或 fetch：DeepSeek API 调用。

### 3.2 为什么此时重构

当前 FastAPI 后端还处于早期，仅完成登录闭环，业务模块尚未大量沉淀。此时切换 TS 后端，重构成本可控；等知识文章、聊天、AI 分析等模块全部完成后再切换，成本会显著增加。

TypeScript 后端对本项目的优势：

- 前后端语言统一，降低长期维护和贡献门槛。
- 可通过 Prisma 和 DTO 生成稳定类型契约。
- 更贴近 Web SaaS 工程生态。
- SSE、WebSocket、文件上传、部署脚本和前端工具链都在 Node 生态内。
- NestJS 模块边界清晰，适合按业务域拆分。

### 3.3 FastAPI 后端处理方式

现有 `backend/` FastAPI 代码作为阶段性参考，不继续扩展业务模块。

重构策略：

1. 新建 `server/` 作为 TypeScript 后端。
2. 在 `server/` 中实现健康检查、统一响应、认证、用户表和登录接口。
3. 保持接口路径兼容当前前端：`/api/user/login`、`/user/login`。
4. 前端代理切到 `server` 的 NestJS 服务端口。
5. TS 后端通过验证后，旧 FastAPI 目录标记为 legacy，后续删除或迁移到归档目录。

## 4. 目标架构

```text
ai-vue project/
  src/                       # Vue3 前端
    api/
      admin.js
      client.js              # 新增，用户端 API
    components/
    router/
    store/
    views/

  server/                    # 新增，TypeScript 后端主线
    prisma/
      schema.prisma
      seed.ts
      migrations/
    src/
      main.ts
      app.module.ts
      common/
        response.ts
        filters/
        interceptors/
        guards/
        decorators/
      config/
      auth/
      users/
      knowledge/
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

  backend/                   # 旧 FastAPI 后端，迁移完成后归档或删除
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

## 6. 数据模型规划

### 6.1 users

用户和管理员账号。

- `id`
- `username`
- `email`
- `passwordHash`
- `role`：`admin` 或 `user`
- `status`：启用、禁用
- `createdAt`
- `updatedAt`

### 6.2 knowledge_categories

知识文章分类。

- `id`
- `categoryName`
- `parentId`
- `sortOrder`
- `status`
- `createdAt`
- `updatedAt`

### 6.3 knowledge_articles

知识文章和用户投稿统一存储。

- `id`
- `title`
- `categoryId`
- `authorId`
- `summary`
- `tags`
- `coverImage`
- `content`
- `readCount`
- `status`：`draft`、`pending_review`、`published`、`rejected`、`offline`
- `rejectReason`
- `publishedAt`
- `createdAt`
- `updatedAt`

### 6.4 chat_sessions

AI 心理咨询会话。

- `id`
- `sessionId`
- `userId`
- `userName`
- `startTime`
- `endTime`
- `messageCount`
- `emotionTags`
- `aiSummary`
- `riskLevel`
- `status`
- `createdAt`
- `updatedAt`

### 6.5 chat_messages

会话消息。

- `id`
- `sessionId`
- `role`：`user` 或 `assistant`
- `content`
- `messageTime`
- `rawPayload`
- `createdAt`

### 6.6 emotion_diaries

情绪日记。

- `id`
- `userId`
- `userName`
- `diaryDate`
- `moodScore`
- `sleepQuality`
- `stressLevel`
- `dominantEmotion`
- `emotionTriggers`
- `diaryContent`
- `createdAt`
- `updatedAt`

### 6.7 ai_analysis_results

AI 分析结果统一表。

- `id`
- `bizType`：`emotion_diary` 或 `chat_session`
- `bizId`
- `mainEmotion`
- `emotionIntensity`
- `emotionNature`
- `riskLevel`
- `riskDescription`
- `professionalAdvice`
- `improvementSuggestions`
- `summary`
- `emotionTags`
- `modelName`
- `rawResponse`
- `status`：`pending`、`success`、`failed`
- `errorMessage`
- `createdAt`
- `updatedAt`

## 7. TypeScript 后端模块规划

### 7.1 common

职责：

- 统一响应包装。
- 全局异常过滤。
- 请求日志。
- 分页 DTO。
- 当前用户装饰器。
- JWT Guard 和角色 Guard。

### 7.2 auth

接口：

- `POST /user/login`
- `POST /api/user/login`
- `POST /user/register`
- `POST /api/user/register`
- `GET /api/user/me`

职责：

- 登录。
- 注册。
- 密码哈希。
- JWT 签发。
- 当前用户读取。

### 7.3 users

接口：

- `GET /api/user/page`
- `PUT /api/user/:id/status`

职责：

- 管理员分页查看用户。
- 启用和禁用用户。
- 角色控制。

### 7.4 knowledge

接口：

- `GET /api/knowledge/category/tree`
- `GET /api/knowledge/article/page`
- `POST /api/knowledge/article`
- `PUT /api/knowledge/article`
- `GET /api/knowledge/article/:id`
- `DELETE /api/knowledge/article/:id`
- `PUT /api/knowledge/article/:id/status`

职责：

- 后台知识分类与文章管理。
- 管理员文章审核和上下线。
- 兼容当前前端管理端页面。

### 7.5 client article

接口：

- `GET /api/client/article/page`
- `POST /api/client/article`
- `PUT /api/client/article/:id`
- `PUT /api/client/article/:id/submit`

职责：

- 普通用户创建文章草稿。
- 提交审核。
- 查看自己的投稿状态。

### 7.6 chat

接口：

- `GET /api/psychological-chat/sessions`
- `GET /api/psychological-chat/sessions/:sessionId`
- `GET /api/psychological-chat/sessions/:sessionId/messages`
- `GET /api/psychological-chat/session/:sessionId/emotion`
- `POST /api/chat/send`

职责：

- 管理端查询咨询记录。
- 用户端 AI 对话。
- SSE 流式输出。
- 会话和消息自动落库。

### 7.7 emotion diary

接口：

- `GET /api/emotion-diary/admin/page`
- `DELETE /api/emotion-diary/admin/:id`
- `POST /api/emotion-diary`
- `GET /api/emotion-diary/my/page`

职责：

- 管理端查看情绪日记。
- 用户端创建和查看自己的情绪日记。

### 7.8 analysis

接口：

- `POST /api/analysis/emotion-diary/:id`
- `GET /api/analysis/emotion-diary/:id`
- `POST /api/analysis/chat-session/:id`
- `GET /api/analysis/chat-session/:id`

职责：

- 触发 AI 分析。
- 查询分析结果。
- 失败兜底。
- 结果落库。

### 7.9 analytics

接口：

- `GET /api/data-analytics/overview`

职责：

- Dashboard 统计。
- 文章数、用户数、会话数、日记数、风险等级分布。

### 7.10 upload

接口：

- `POST /api/file/upload`

职责：

- 封面和附件上传。
- 限制文件大小、类型和存储目录。

## 8. 前端改造计划

### 8.1 认证状态统一

新增：

- `src/store/useAuthStore.js`

职责：

- 保存 token。
- 保存用户信息和角色。
- 登录后按角色跳转。
- 退出登录时清理状态。
- 路由守卫读取统一状态。

### 8.2 路由结构

```text
/auth
  /auth/login
  /auth/register

/client
  /client/chat
  /client/articles
  /client/articles/create
  /client/articles/:id/edit

/back
  /back/dashboard
  /back/knowledge
  /back/consultations
  /back/logs
  /back/users
```

### 8.3 新增页面和组件

新增页面：

- `src/views/ClientChat.vue`
- `src/views/ClientArticles.vue`
- `src/views/ClientArticleCreate.vue`
- `src/views/Users.vue`

新增组件：

- `src/components/ClientLayout.vue`
- `src/components/ChatMessageBubble.vue`
- `src/components/StreamingText.vue`

新增工具：

- `src/api/client.js`
- `src/utils/sse.js`

### 8.4 前端工程优化

- 将 wangEditor 相关页面懒加载，降低 chunk 体积。
- 统一空状态、错误状态、加载状态。
- 所有页面避免直接拼接接口路径，统一走 api 层。
- SSE 解析逻辑放到 `src/utils/sse.js`。
- 逐步将关键 API 响应类型从后端 OpenAPI 生成，减少字段漂移。

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

## 10. 文章投稿审核流程

状态机：

```text
draft -> pending_review -> published
draft -> pending_review -> rejected -> draft
published -> offline -> published
```

权限：

| 操作 | 普通用户 | 管理员 |
| --- | --- | --- |
| 创建草稿 | 可以 | 可以 |
| 编辑自己的草稿 | 可以 | 可以 |
| 提交审核 | 可以 | 可以 |
| 审核通过 | 不可以 | 可以 |
| 驳回 | 不可以 | 可以 |
| 下线 | 不可以 | 可以 |
| 删除文章 | 仅自己的草稿 | 可以 |
| 查看全部文章 | 不可以 | 可以 |

## 11. 开源化准备清单

必须新增或完善：

- `LICENSE`：建议 MIT。
- `CONTRIBUTING.md`：贡献指南。
- `CHANGELOG.md`：变更记录。
- `.gitattributes`：统一换行和编码。
- `.env.example`：前端、server、DeepSeek 配置模板。
- `scripts/start.ps1`：Windows 一键启动。
- `scripts/start.sh`：macOS/Linux 一键启动。
- `scripts/seed-demo`：初始化演示数据。
- README 截图或 GIF。
- 安全说明：不要提交 `.env`、数据库文件、上传文件和 API Key。

## 12. 分阶段交付计划

### Phase 0：开源化基础与 TS 后端脚手架

✅ **已完成（2026-05-08）**

目标：
- 新建 `server/` NestJS 项目。
- 配置 Prisma、环境变量、统一响应、异常过滤、Swagger。
- 建立 users 模型、migration、seed。
- 实现健康检查、登录、注册、当前用户接口。
- 保持 `/api/user/login` 兼容当前前端。
- README、CONTRIBUTING、CHANGELOG、LICENSE、`.gitattributes`、启动脚本初版。

验收：
- `npm run build` 前端通过。
- `server` 可以启动。
- Prisma migration 可以创建 users 表。
- seed 可以创建管理员账号。
- 前端登录页可通过 TS 后端登录并进入 `/back/dashboard`。

### Phase 1：管理端已有页面真实化

✅ **已完成（2026-05-08）**

目标：
- 实现知识分类和文章 CRUD。
- 实现文件上传。
- 实现咨询记录分页、详情、消息列表。
- 实现情绪日记分页、详情和删除。
- 实现 Dashboard 统计接口。
- 管理端页面全部接入 TS 后端真实接口。

验收：
- 知识文章页面可新增、编辑、删除、上下线。
- 咨询记录页面可打开详情并展示消息。
- 情绪日记页面可筛选、查看、删除。
- Dashboard 展示真实统计。

### Phase 2：用户体系与用户端基础

✅ **已完成（2026-05-09）**

目标：
- 完善注册、登录、退出登录。
- 新增 `useAuthStore`。
- 新增角色路由守卫。
- 新增 ClientLayout。
- 新增用户文章列表、写文章页面。

验收：
- 普通用户不能访问 `/back/*`。
- 管理员可以访问 `/back/*`。
- 登录用户可以访问 `/client/*`。
- 用户可以创建文章草稿并提交审核。

### Phase 3：DeepSeek 聊天与会话落库

✅ **已完成**

目标：
- 实现 `POST /api/chat/send` SSE。
- 对接 DeepSeek stream。
- 保存用户消息和 AI 回复。
- 更新会话摘要字段的基础数据。
- 新增 ClientChat 页面。
- 支持 mock AI 模式。

验收：
- 用户可以实时看到 AI 流式回复。
- 会话和消息自动落库。
- 管理员能在咨询记录看到会话。
- 无 DeepSeek Key 时 mock 模式可演示。

### Phase 4：AI 分析与风险兜底

🟡 **待完成 — 后端已完成，前端集成缺失**

目标：
- 实现 AI 分析结果表。
- 实现情绪日记分析。
- 实现会话摘要和风险等级分析。
- 分析失败不影响列表和详情打开。
- 管理端详情展示分析结果。

当前状态：后端 `AnalysisController` + `AnalysisService` 已实现（含 mock AI），但前端 `EmotionDiaryDetailDialog` 和 `SessionDetailDialog` 未调用分析接口。

验收：
- 情绪日记详情展示主情绪、强度、风险等级和建议。
- 咨询记录展示情绪标签、摘要和风险等级。
- 分析结果重复打开不重复调用模型。

### Phase 5：文章审核闭环

🟡 **待完成 — 基础状态机可用，缺审核队列页**

目标：
- 完整实现文章状态机。
- 管理端新增审核队列。
- 支持通过、驳回、下线、重新发布。
- 用户端可查看投稿状态和驳回原因。

当前状态：用户端可提交审核（`draft → pending_review`），管理员可通过 `/knowledge/article/page?status=pending_review` + 状态接口操作。缺少专用审核队列页面。

验收：
- 用户投稿后进入待审核。
- 管理员审核通过后文章进入知识库。
- 驳回后用户可编辑并再次提交。

### Phase 6：演示数据、文档和发布准备

❌ **未开始**

目标：
- 演示数据 seed：文章、用户、会话、消息、日记、分析结果。
- README 增加截图和完整快速开始。
- 增加 API 文档说明。
- 增加部署说明。

目标：

- 演示数据 seed：文章、用户、会话、消息、日记、分析结果。
- README 增加截图和完整快速开始。
- 增加 API 文档说明。
- 增加部署说明。
- 清理 legacy FastAPI 后端或移动到归档目录。

验收：

- 新贡献者 clone 后可按 README 启动。
- 一条命令可初始化演示数据。
- 构建无错误。
- 项目文档不再出现互相矛盾的后端技术路线。

## 13. 验证策略

每阶段必须验证：

```powershell
npm run build
```

TypeScript 后端：

```powershell
cd server
npm run lint
npm run build
npm run test
npx prisma migrate status
```

接口验证：

- `GET /api/health`
- `POST /api/user/login`
- `POST /api/user/register`
- `GET /api/user/me`

关键手动流程：

- 注册 -> 登录 -> 进入用户端。
- 管理员登录 -> 进入后台。
- 用户聊天 -> 会话落库 -> 后台咨询记录可见。
- 用户投稿 -> 管理员审核 -> 知识库展示。
- 创建情绪日记 -> 触发分析 -> 详情展示分析结果。

## 14. 风险与控制

### 范围膨胀

控制方式：每个 Phase 都必须有可运行验收结果，不跨阶段堆半成品。

### API 契约漂移

控制方式：后端优先兼容 `src/api/admin.js`，新增用户端 API 先写请求和响应示例，再开发页面。

### 数据迁移混乱

控制方式：从 TS 后端第一天开始使用 Prisma migration，不再依赖自动建表。

### AI 成本和稳定性

控制方式：AI 结果落库、列表页只读数据库、支持 mock 模式、超时降级。

### 心理健康合规风险

控制方式：系统提示词、前端提示和高风险内容处理必须明确“不提供医疗诊断”。

### 开源安全风险

控制方式：提交前检查 `.env`、数据库文件、上传文件和 API Key；README 明确安全注意事项。

## 15. 立即执行顺序

下一步直接从 Phase 0 开始：

1. 新建 `server/` NestJS 项目。
2. 配置 Prisma 和环境模板。
3. 实现统一响应、异常过滤、健康检查。
4. 实现 users schema、migration、seed。
5. 实现登录、注册、当前用户接口。
6. 切换 Vite 代理到 TS 后端。
7. 验证前端登录闭环。
8. 新增开源化基础文件。

完成 Phase 0 后，再进入管理端已有页面真实化，不再继续扩展 FastAPI 后端。
