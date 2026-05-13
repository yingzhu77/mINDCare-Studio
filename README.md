# AI 心理健康管理平台

面向长期 Web SaaS 开源方向推进的 AI 心理健康管理平台。项目目标不是只做一个本地后台演示，而是建设一个可 clone、可启动、可贡献、可扩展的全栈开源项目。

## 项目状态

**当前版本：v2.5.1 — 文章审核流程收口 + 管理端知识文章体验修复 + 登录/性能优化**

| 层级   | 状态          | 说明                                                                                |
| ------ | ------------- | ----------------------------------------------------------------------------------- |
| 前端   | ✅ 管理端完成 | 登录/Dashboard(含 ECharts 趋势图)/知识文章 CRUD+审核/咨询记录/情绪日志/用户管理/分析页 |
| 前端   | ✅ 用户端完整 | ClientLayout + AI 聊天(SSE + 会话侧边栏+删除/导出) + 情绪日记 + 文章投稿+修订+知识阅读 + 通知铃铛 |
| 后端   | ✅ 全部完成   | NestJS + Prisma + 9 实体(含通知+修订) + 认证 + 管理端/用户端接口 + AI 模块 + 审核通知 |
| 数据库 | ✅ 主线完成   | Prisma migration 管理，SQLite 开发，可切换 MySQL，含 KnowledgeArticleRevision 表     |
| AI     | ✅ 骨架就绪   | DeepSeek 客户端 + mock AI 模式 + SSE 流式 + 分析结果落库+缓存                       |
| P5-P8  | ✅ 全部完成   | 聊天历史管理、Docker 部署、GitHub Actions CI、Playwright E2E、测试深化              |

## 目标技术栈

**前端：**

- Vue3
- Vite
- Element Plus
- Axios + Pinia + Vue Router
- wangEditor

**后端主线（server/）：**

- TypeScript
- NestJS
- Prisma
- MySQL（开发期可用 SQLite）
- JWT
- Swagger / OpenAPI

**AI 接入：**

- DeepSeek API（兼容 OpenAI 接口格式）
- 后端代理调用 + SSE 流式响应
- 分析结果落库 + mock AI 演示模式

## 目录结构

```text
src/                       # Vue3 前端
  api/
    admin.ts               # 管理端 API 封装（TypeScript）
    client.ts              # 用户端 API 封装（聊天、情绪日记）
    types.ts               # 类型定义
  components/              # 复用组件（侧边栏、弹窗、通知铃铛等）
  router/                  # 路由与鉴权守卫（角色区分 admin/user）
  store/                   # Pinia 状态管理（auth、menu、review）
  utils/                   # 工具函数（请求封装、消息解析、日期格式化、日志）
  views/                   # 页面级组件
    AuthLayout.vue         # 登录/注册布局
    Login.vue              # 登录页
    Register.vue           # 注册页
    Dashboard.vue          # 管理端仪表盘（ECharts 趋势图）
    knowledge.vue          # 知识文章管理
    emotional.vue          # 情绪日志管理
    logs.vue               # 咨询记录
    ArticleReview.vue      # 文章审核（含修订）
    Analytics.vue          # 数据洞察分析页
    ClientLayout.vue       # 用户端布局（顶部导航 + 通知铃铛）
    ClientChat.vue         # AI 聊天（SSE 流式 + 会话侧边栏）
    ClientDiary.vue        # 用户端情绪日记
    ClientArticles.vue     # 用户端文章投稿列表
    ClientArticleCreate.vue# 用户端投稿编辑

server/                    # NestJS + Prisma 后端
  prisma/
    schema.prisma          # 9 个核心实体（含 notification + revision）
    seed.ts                # 管理员 + 测试用户 + 演示数据
    migrations/
  src/
    main.ts
    app.module.ts
    common/                # 统一响应、异常过滤、Guard、装饰器
    auth/                  # 认证模块
    users/                 # 用户管理
    knowledge/             # 知识文章 + 审核
    chat/                  # 咨询会话 + AI 聊天 SSE
    emotion-diary/         # 情绪日记
    analysis/              # AI 分析（情绪分析、会话摘要）
    analytics/             # Dashboard 数据概览 + 趋势
    upload/                # 文件上传
    ai/                    # DeepSeek 客户端 + mock 模式
    notification/          # 审核通知
    client-article/        # 用户端文章投稿
  package.json
  tsconfig.json
  .env.example

docs/                      # 项目文档和计划书
scripts/                   # 一键启动和演示数据脚本
e2e/                       # Playwright E2E 测试
public/                    # 静态资源（favicon、icons）
```

## 本地运行

### 前端

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

访问：`http://127.0.0.1:5173`

- 管理端：`/auth/login`（admin 角色登录后自动跳转 `/back/dashboard`）
- 用户端：`/auth/login`（user 角色登录后自动跳转 `/client/chat`）

### 后端（NestJS 主线）

```powershell
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

## 已实现接口

### 认证

| 方法 | 路径                 | 说明                 |
| ---- | -------------------- | -------------------- |
| POST | `/api/user/login`    | 登录，返回 JWT token |
| POST | `/api/user/register` | 注册                 |
| GET  | `/api/user/me`       | 当前用户信息         |

### 管理端

| 方法                | 路径                                            | 说明                               |
| ------------------- | ----------------------------------------------- | ---------------------------------- |
| GET                 | `/api/knowledge/category/tree`                  | 知识分类树                         |
| GET/POST/PUT/DELETE | `/api/knowledge/article/**`                     | 文章 CRUD                          |
| PUT                 | `/api/knowledge/article/:id/status`             | 管理端文章发布/下线/重新发布       |
| GET                 | `/api/knowledge/article/review/page`            | 文章/修订统一审核列表              |
| GET                 | `/api/knowledge/article/review/pending-count`   | 待审核数量                         |
| GET                 | `/api/knowledge/article/review/:type/:id`       | 审核预览详情                       |
| PUT                 | `/api/knowledge/article/review/:type/:id/status`| 审核通过/驳回                      |
| GET                 | `/api/psychological-chat/sessions`              | 咨询会话列表                       |
| GET                 | `/api/psychological-chat/sessions/:id/messages` | 会话消息                           |
| GET                 | `/api/emotion-diary/admin/page`                 | 情绪日记管理端分页                 |
| DELETE              | `/api/emotion-diary/admin/:id`                  | 情绪日记删除                       |
| GET                 | `/api/data-analytics/overview`                  | Dashboard 统计概览                 |
| GET                 | `/api/data-analytics/trends`                    | Dashboard 趋势图（情绪/咨询/文章） |
| POST                | `/api/file/upload`                              | 文件上传                           |
| POST                | `/api/analysis/emotion-diary/:id`               | 触发情绪日记 AI 分析               |
| GET                 | `/api/analysis/emotion-diary/:id`               | 获取情绪日记分析结果               |
| POST                | `/api/analysis/chat-session/:id`                | 触发会话 AI 分析                   |
| GET                 | `/api/analysis/chat-session/:id`                | 获取会话分析结果                   |
| GET                 | `/api/user/page`                                | 用户管理分页                       |
| PUT                 | `/api/user/:id/status`                          | 启用/禁用用户                      |
| GET                 | `/api/notification/list`                        | 通知列表                           |
| GET                 | `/api/notification/unread-count`                | 未读通知数                         |
| PUT                 | `/api/notification/read/:id`                    | 标记通知已读                       |
| PUT                 | `/api/notification/read-all`                    | 全部标记已读                       |

### 用户端

| 方法   | 路径                                  | 说明                      |
| ------ | ------------------------------------- | ------------------------- |
| POST   | `/api/chat/send`                      | AI 聊天 SSE 流式          |
| GET    | `/api/chat/sessions/my`               | 我的会话列表带预览        |
| DELETE | `/api/chat/session/:sessionId`        | 删除会话（级联消息+分析） |
| GET    | `/api/chat/session/:sessionId/export` | 导出会话为 JSON           |
| POST   | `/api/emotion-diary`                  | 新增情绪日记              |
| GET    | `/api/emotion-diary/my/page`          | 我的情绪日记分页          |
| PUT    | `/api/emotion-diary/:id`              | 更新情绪日记              |
| DELETE | `/api/emotion-diary/:id`              | 删除情绪日记（用户端）    |
| GET    | `/api/client/article/page`            | 我的投稿列表              |
| POST   | `/api/client/article`                 | 创建投稿                  |
| PUT    | `/api/client/article/:id`             | 编辑投稿                  |
| PUT    | `/api/client/article/:id/submit`      | 提交审核                  |

### 统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页返回：

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

## 默认账号

| 角色   | 用户名 | 密码        |
| ------ | ------ | ----------- |
| 管理员 | admin  | admin123456 |

## 主计划书

所有开发决策、阶段划分、验收标准均以主计划书为准：

- [docs/project-fullstack-plan.md](docs/project-fullstack-plan.md)

## 验证命令

前端构建：

```powershell
npm run build
```

后端验证：

```powershell
cd server
npm run build
npx prisma migrate status
```

前后端单元测试：

```powershell
npm run test
cd server
npm run test:unit
```

登录接口验证：

```powershell
curl -X POST http://127.0.0.1:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```

### Playwright E2E 测试

前置条件：后端已构建（`cd server && npm run build`）。

```powershell
# 运行全部 E2E 测试（自动启动前后端服务）
npx playwright test

# 指定文件
npx playwright test e2e/smoke.spec.ts

# UI 调试模式
npx playwright test --ui
```

> - 本地运行复用已有端口（`5174` / `8001`），CI 环境干净启动
> - 测试不依赖真实 DeepSeek API，后端自动降级 Mock AI 模式
> - 端口冲突时错误信息明确，参考 `docs/current-state.md`

## AI 功能配置

### Mock AI 模式（默认）

项目默认使用 **Mock AI 模式**，无需任何 API Key 即可完整演示所有功能。AI 聊天会返回预设回复（逐字流式效果），分析功能返回模拟的结构化结果。**此模式适合开发、演示和评估阶段。**

### 接入真实 DeepSeek API

如需使用真实 AI 能力（推荐在部署到生产环境前接入），请配置 API Key：

```powershell
# 编辑 server/.env，填入你的 DeepSeek API Key
DEEPSEEK_API_KEY=sk-your-key-here
```

重启后端后，所有 AI 功能自动切换到真实模型调用：

- AI 聊天使用 DeepSeek Chat 模型实时生成回复
- 情绪日记分析使用真实模型分析
- 会话摘要由模型生成真实摘要

> ⚠️ **注意**：
>
> - API Key 只存在于后端 `.env` 文件中，不会写入前端或提交到仓库
> - 未配置 Key 时系统自动使用 Mock 模式，不会报错
> - 如果你 clone 了本仓库，使用前请先确认是否已配置自己的 API Key

## 产品安全声明

### 平台定位

**AI 心理健康管理平台**是一个提供 AI 辅助心理支持的技术工具，旨在帮助用户记录情绪、获取心理健康科普知识和初步的情绪觉察支持。

### AI 能力边界

- AI 助手（聊天功能）基于大语言模型生成回复，**不提供医疗诊断、处方或心理治疗**。
- AI 分析结果（情绪分析、会话摘要）仅供用户参考，**不能替代专业心理健康服务**。
- 平台所有 AI 功能均设计为辅助工具，**不具备临床决策能力**。

### 紧急情况处理

- 当用户表达自伤、自杀或伤害他人意图时，AI 会优先提供心理援助热线信息，并强烈建议寻求专业帮助。
- 平台内置危机关键词检测机制，确保在高风险对话中优先推送求助资源。
- **如您或身边人正处于紧急危险中，请立即拨打 110 或前往最近的医院急诊。**

### 不替代专业医疗

本平台及其 AI 功能**不得用于**：

- 替代专业心理咨询或心理治疗
- 诊断精神健康障碍
- 开具处方或治疗方案
- 监测或管理严重精神疾病

如果您需要专业心理健康服务，请联系：

- **全国心理援助热线：400-161-9995**
- **北京心理危机干预中心：010-82951332**

### 数据隐私提醒

- AI 聊天内容会存储在服务器中用于对话连续性
- 建议不要在对话中透露个人身份信息（真实姓名、身份证号、住址等）
- 详细的隐私政策请参阅项目相关文档
