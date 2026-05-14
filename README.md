# AI 心理健康管理平台

[简体中文](README.md) · [English](README.en.md) · [繁體中文](README.zh-TW.md)

基于 Vue3 + NestJS + DeepSeek AI 的全栈心理健康管理平台。支持管理后台和用户端双角色，提供 AI 聊天、情绪日记、知识科普、数据看板等功能，已打包为 Windows 桌面应用。
参考项目：[B站 BV1Rh41117o](https://b23.tv/CuL7lkI)

## AI 辅助开发实践

本项目全程使用 Codex + Claude Code（接入 DeepSeek V4）完成。以下是开发过程中沉淀的方法。

- **CLAUDE.md 约束文件** — 定义 7 条核心规则：先想清楚再写、保持最小实现、只做手术式改动、目标驱动执行、分层不可打乱、接口稳定优先、API Key 合规。这些规则写死在 `.claude/CLAUDE.md` 中，每次对话自动加载，无需口头重复。
- **上下文管理** — 全栈项目容易超出单次对话窗口。CLAUDE.md 第 18 节是「会话交接段」，每次关闭前把当前完成节点、下一任务、边界约束写入文档，下个窗口自动恢复。配合 Memory 系统持久化偏好和决策，避免反复说明。
- **Skill 机制** — 通过专用 skill 处理特定任务：`code-review-expert`（代码审查）、`security-review`（安全审查）、`playwright`（浏览器联调/E2E）、`web-design-guidelines`（可访问性审查）、`simplify`（消除过度设计）。
- **测试策略** — 每次改动后运行 `npm run build` 确保无编译错误；后端接口用 curl 验证返回结构；`e2e/` 下 14 条 Playwright 用例覆盖登录→管理后台→用户端→AI 聊天→情绪日记全流程。
- **开发原则** — 文档即代码（CLAUDE.md / project-context.md / README 三者联动，不互相矛盾）；AI 是协作者（每步可追溯可回滚，代码经构建和人工确认）；先跑通再优化（Mock AI → 真实 AI，SQLite → MySQL，阶段递进）。

## 项目状态

**当前版本：v2.6.0 — Docker 部署线 + Electron Windows 桌面演示版 + 开源上线准备**

 | 层级 | 状态 | 说明 |
 | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
 | 前端 | ✅ 管理端完成 | 暖薰衣草紫统一主题 + 首页 + 登录/Dashboard(ECharts 趋势图)/知识文章 CRUD+审核/咨询记录/情绪日志/用户管理/分析页 |
 | 前端 | ✅ 用户端完整 | ClientLayout(顶部导航) + AI 聊天(SSE+会话侧边栏+删除/导出) + 情绪日记 + 情绪洞察(趋势/分布/图表) + 文章投稿+修订+知识阅读 + 通知铃铛 |
 | 后端 | ✅ 全部完成 | NestJS + Prisma + 9 实体(含通知+修订) + 认证 + 管理端/用户端接口 + AI 模块 + 审核通知 |
 | 数据库 | ✅ 主线完成 | Prisma migration 管理，SQLite 开发，可切换 MySQL，含 KnowledgeArticleRevision 表 |
 | AI | ✅ 骨架就绪 | DeepSeek 客户端 + mock AI 模式 + SSE 流式 + 分析结果落库+缓存 |
 | 基础设施 | ✅ 就绪 | Docker Compose 三容器编排、GitHub Actions CI、Playwright E2E 14 用例 |

## 技术栈

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
    Home.vue               # 首页（功能卡片 + 关于区域）
    Dashboard.vue          # 管理端仪表盘（ECharts 趋势图）
    knowledge.vue          # 知识文章管理
    emotional.vue          # 情绪日志管理
    logs.vue               # 咨询记录
    ArticleReview.vue      # 文章审核（含修订）
    Analytics.vue          # 数据洞察分析页
    ClientLayout.vue       # 用户端布局（顶部导航 + 通知铃铛）
    ClientChat.vue         # AI 聊天（SSE 流式 + 会话侧边栏）
    ClientDiary.vue        # 用户端情绪日记
    ClientEmotionInsights.vue        # 用户端情绪洞察（图表）
    ClientArticles.vue     # 用户端文章投稿列表
    ClientArticleCreate.vue# 用户端投稿编辑
    ClientArticleBrowse.vue # 用户端知识阅读
    ClientArticleDetail.vue # 用户端文章详情

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
scripts/                   # 一键启动脚本
e2e/                       # Playwright E2E 测试
public/                    # 静态资源（favicon、icons）
desktop/                   # Electron 桌面版（已完成 — NSIS + portable 打包就绪）
```

## 运行方式

项目支持三种运行方式，按需选择：

 | 方式 | 适用场景 | 数据库 | AI |
 | ------ | ---------- | -------- | ---- |
 | 开发运行 | 改代码 / 调试 | SQLite（可切换 MySQL） | Mock AI（可配 Key） |
 | Docker 部署 | 生产 / 自部署 | MySQL 8.0 | 可配真实 Key |
 | Windows EXE | 本地演示 / 复现 | SQLite | Mock AI（可配 Key） |

### 方式一：开发运行

**前端**

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

**后端（NestJS 主线）**

```powershell
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

访问：`http://127.0.0.1:5173`

- 管理端：`/auth/login`（admin 角色登录后自动跳转 `/back/dashboard`）
- 用户端：`/auth/login`（user 角色登录后自动跳转 `/client/chat`）

或使用一键启动脚本：

```powershell
# Windows
.\scripts\start-dev.ps1

# macOS / Linux
bash scripts/setup.sh
```

### 方式二：Docker Compose

```bash
docker compose up -d
```

访问 `http://localhost:8080`。详见 [docs/deployment.md](docs/deployment.md)。

### 方式三：Windows 演示 EXE

项目已打包为 Windows 桌面应用，双击运行，内置前后端 + SQLite + Mock AI：

```powershell
cd desktop
npm run dist
```

产物位于 `desktop/dist-electron/`：

- `AI心理健康助手 Setup 1.0.0.exe` — NSIS 安装包
- `AI心理健康助手-portable-1.0.0.exe` — 便携版（免安装）

详见 [docs/deployment-plan.md](docs/deployment-plan.md) 路线 B。

## 运行说明

> ⚠️ 本项目目前**仅进行过本地开发环境测试和 Windows EXE 桌面应用测试**，尚未在生产服务器上部署运行。如果你计划部署到公网服务器，请自行评估安全加固（HTTPS、反向代理、数据库访问控制等），详见 `docs/deployment.md`。

## 已实现接口

### 公共页面

 | 路径 | 说明 |
 | ---------------- | -------------------------------- |
 | `/` | 首页（功能卡片 + 关于区域） |
 | `/auth/login` | 登录页（左侧 logo + 暖金色文案） |
 | `/auth/register` | 注册 |

### 认证

 | 方法 | 路径 | 说明 |
 | ---- | -------------------- | -------------------- |
 | POST | `/api/user/login` | 登录，返回 JWT token |
 | POST | `/api/user/register` | 注册 |
 | GET | `/api/user/me` | 当前用户信息 |

### 管理端

 | 方法 | 路径 | 说明 |
 | ------------------- | ------------------------------------------------ | ---------------------------------- |
 | GET | `/api/knowledge/category/tree` | 知识分类树 |
 | GET/POST/PUT/DELETE | `/api/knowledge/article/**` | 文章 CRUD |
 | PUT | `/api/knowledge/article/:id/status` | 管理端文章发布/下线/重新发布 |
 | GET | `/api/knowledge/article/review/page` | 文章/修订统一审核列表 |
 | GET | `/api/knowledge/article/review/pending-count` | 待审核数量 |
 | GET | `/api/knowledge/article/review/:type/:id` | 审核预览详情 |
 | PUT | `/api/knowledge/article/review/:type/:id/status` | 审核通过/驳回 |
 | GET | `/api/psychological-chat/sessions` | 咨询会话列表 |
 | GET | `/api/psychological-chat/sessions/:id/messages` | 会话消息 |
 | GET | `/api/emotion-diary/admin/page` | 情绪日记管理端分页 |
 | DELETE | `/api/emotion-diary/admin/:id` | 情绪日记删除 |
 | GET | `/api/data-analytics/overview` | Dashboard 统计概览 |
 | GET | `/api/data-analytics/trends` | Dashboard 趋势图（情绪/咨询/文章） |
 | POST | `/api/file/upload` | 文件上传 |
 | POST | `/api/analysis/emotion-diary/:id` | 触发情绪日记 AI 分析 |
 | GET | `/api/analysis/emotion-diary/:id` | 获取情绪日记分析结果 |
 | POST | `/api/analysis/chat-session/:id` | 触发会话 AI 分析 |
 | GET | `/api/analysis/chat-session/:id` | 获取会话分析结果 |
 | GET | `/api/user/page` | 用户管理分页 |
 | PUT | `/api/user/:id/status` | 启用/禁用用户 |
 | GET | `/api/notification/list` | 通知列表 |
 | GET | `/api/notification/unread-count` | 未读通知数 |
 | PUT | `/api/notification/read/:id` | 标记通知已读 |
 | PUT | `/api/notification/read-all` | 全部标记已读 |

### 用户端

 | 方法 | 路径 | 说明 |
 | ------ | ------------------------------------- | ----------------------------- |
 | POST | `/api/chat/send` | AI 聊天 SSE 流式 |
 | GET | `/api/chat/sessions/my` | 我的会话列表带预览 |
 | DELETE | `/api/chat/session/:sessionId` | 删除会话（级联消息+分析） |
 | GET | `/api/chat/session/:sessionId/export` | 导出会话为 JSON |
 | POST | `/api/emotion-diary` | 新增情绪日记 |
 | GET | `/api/emotion-diary/my/page` | 我的情绪日记分页 |
 | PUT | `/api/emotion-diary/:id` | 更新情绪日记 |
 | DELETE | `/api/emotion-diary/:id` | 删除情绪日记（用户端） |
 | GET | `/api/emotion-diary/my/statistics` | 我的情绪数据统计（趋势/分布） |
 | GET | `/api/client/article/page` | 我的投稿列表 |
 | POST | `/api/client/article` | 创建投稿 |
 | PUT | `/api/client/article/:id` | 编辑投稿 |
 | PUT | `/api/client/article/:id/submit` | 提交审核 |

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

 | 角色 | 用户名 | 密码 |
 | -------- | -------- | ----------- |
 | 管理员 | admin | admin123456 |
 | 测试用户 | testuser | admin123456 |

> 所有环境使用相同种子数据，包含管理员和测试用户各一，以及示例文章、会话记录和情绪日记。

## 部署与运维

- [docs/deployment.md](docs/deployment.md) — Docker Compose 三容器编排 + Nginx SSL + 安全加固
- [docs/deployment-plan.md](docs/deployment-plan.md) — 部署上线双线计划（开源部署线 + Windows EXE 线）

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
DEEPSEEK_API_KEY=<your_deepseek_api_key>
```

重启后端后，所有 AI 功能自动切换到真实模型调用：

- AI 聊天使用 DeepSeek v4-Flash 模型实时生成回复
- 情绪日记分析使用真实模型分析
- 会话摘要由模型生成真实摘要

> ⚠️ **注意**：
>
> - API Key 只存在于后端 `.env` 文件中，不会写入前端或提交到仓库
> - 未配置 Key 时系统自动使用 Mock 模式，不会报错
> - 如果你 clone 了本仓库，使用前请先确认是否已配置自己的 API Key

## 多语言说明

本项目支持简体中文、繁体中文和英文界面，通过 vue-i18n 实现。

**翻译范围：** 导航菜单、按钮、标签、提示信息等 UI 框架文字已完整翻译。页面中由用户生成的内容（文章正文、情绪日记内容、AI 聊天消息等）保持原语言不变，不会自动翻译。

**切换方式：** 管理端顶栏或用户端导航栏右侧的语言切换下拉菜单，可随时切换界面语言。浏览器默认语言为 `zh-TW`/`zh-HK`/`zh-MO` 时会自动加载繁体中文。

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
