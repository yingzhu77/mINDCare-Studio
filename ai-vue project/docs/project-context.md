# 项目上下文

## 项目定位

本项目定位为长期 Web SaaS 形态的开源 AI 心理健康管理平台。核心目标不是只完成一个本地后台演示，而是逐步建设一个可 clone、可启动、可贡献、可扩展的全栈项目。

目标业务闭环：

- 管理员登录与后台访问控制。
- 普通用户注册、登录和用户端访问。
- AI 心理咨询对话。
- 咨询会话和消息落库。
- 情绪日记管理。
- 知识文章管理。
- 用户投稿和管理员审核发布。
- AI 情绪分析、会话摘要和风险等级识别。
- Dashboard 数据概览。

## 当前状态 (v0.4.0)

### 前端管理端（已完成真实化）

- Vue3 + Vite 项目结构。
- Element Plus 管理端 UI。
- 登录页、注册页、Dashboard、知识文章、咨询记录、情绪日志页面。
- 后台布局、侧边栏、顶部栏和路由守卫（角色区分 admin/user）。
- 文章、会话、情绪日记相关弹窗组件。
- `src/api/admin.js` 管理端 API 封装。
- 所有管理端页面已从模拟数据切换为真实后端接口。

### 前端用户端（v0.4.0 新增）

- `ClientLayout.vue` — 顶部导航布局（水平菜单 + 用户信息 + 退出）。
- `ClientChat.vue` — AI 聊天页面（fetch + ReadableStream 解析 SSE 流式回复，含快捷提问、会话恢复）。
- `ClientDiary.vue` — 用户端情绪日记（分页列表、新增/编辑弹窗、删除，心情/睡眠/压力评分滑块）。
- `src/api/client.js` — 用户端 API 封装（聊天、情绪日记 CRUD）。
- 路由：`/client/chat`、`/client/diary`，允许 admin/user 角色访问。
- 登录后按角色跳转：admin → `/back/dashboard`，user → `/client/chat`。

### 后端主线（`server/` NestJS，2026-05-08 重构完成）

- NestJS + Prisma + SQLite（生产可切换 MySQL）。
- 统一响应结构 `{ code, message, data }`。
- 全局异常过滤 + 请求校验。
- JWT 认证（兼容 `token` 头和 `Authorization: Bearer`）。
- 角色守卫（admin/user）。
- 全局 `/api` 路由前缀。
- 全部 7 个 Prisma 实体：users、knowledge_categories、knowledge_articles、chat_sessions、chat_messages、emotion_diaries、ai_analysis_results。
- 管理员种子账号和默认分类 seed。
- 已实现接口：

  | 模块 | 接口 |
  |---|---|
  | auth | `POST /api/user/login`、`POST /api/user/register`、`GET /api/user/me` |
  | users | `GET /api/user/page`、`PUT /api/user/:id/status` |
  | knowledge | `GET /api/knowledge/category/tree`、文章 CRUD、状态变更 |
  | chat | 管理端会话/消息查询、`POST /api/chat/send`（SSE 流式） |
  | emotion-diary | 管理端分页/删除、用户端创建/更新/我的日记 |
  | analytics | `GET /api/data-analytics/overview` — Dashboard 统计 |
  | analysis | 情绪日记分析、会话摘要分析的触发和查询 |
  | upload | `POST /api/file/upload` |
  | AI | DeepSeek 客户端 + mock AI 演示模式 |

遗留底端：

- `backend/` FastAPI 早期实现，仅作为迁移参考，不再继续扩展。

## 目标技术栈

前端：

- Vue3
- Vite
- Element Plus
- Axios
- Pinia
- Vue Router
- wangEditor

后端主线：

- TypeScript
- NestJS
- Prisma
- MySQL
- JWT
- Swagger / OpenAPI

AI：

- DeepSeek API
- SSE 流式响应
- 后端代理调用
- mock AI 演示模式
- AI 分析结果落库

## 当前本地地址

当前前端：

- `http://127.0.0.1:5173/auth/login`（登录）
- `http://127.0.0.1:5173/back/dashboard`（管理后台）
- `http://127.0.0.1:5173/client/chat`（用户端 AI 聊天）
- `http://127.0.0.1:5173/client/diary`（用户端情绪日记）

当前 NestJS 后端：

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/health`

Vite 代理保持 `/api` 前缀不变，默认代理到 `http://127.0.0.1:8000`。

## 默认账号

- 用户名：`admin`
- 密码：`admin123456`

## 当前主计划

唯一主计划书：

- `docs/project-fullstack-plan.md`

该计划已经合并：

- 开源化计划。
- TypeScript 后端重构路线。
- 之前的可行性评估。
- 阶段优先级优化建议。
- DeepSeek 接入方案。
- 文章投稿审核流程。
- 验收标准。

## 开发约定

- 前端继续使用 `/api` 作为接口前缀。
- TS 后端必须兼容当前 `src/api/admin.js` 的已有路径。
- 所有核心接口统一返回 `{ code, message, data }`。
- 分页接口统一返回 `records`、`total`、`currentPage`、`size`。
- token 请求头兼容当前 `token`，同时支持 `Authorization: Bearer <token>`。
- 敏感配置只放 `.env`，不提交真实 API Key。
- AI API Key 只能存在后端环境变量。
- AI 分析结果必须落库，列表页不直接批量调用模型。
- 从 TS 后端第一天开始使用 Prisma migration，不再依赖自动建表。

## 立即下一步

已完成 Phase 0（NestJS 脚手架 + 认证闭环）+ Phase 1（管理端页面真实化）+ Phase 2（用户端基础模块）。
下一窗口从 **Phase 2 收尾 — 用户端完善** 开始：

### 第一优先级：用户端文章投稿

- 新建 `src/views/ClientArticles.vue` — 用户文章投稿列表
- 新建 `src/views/ClientArticleCreate.vue` — 投稿/编辑页
- 后端已有接口：`GET /api/client/article/page`、`POST /api/client/article`、`PUT /api/client/article/:id`、`PUT /api/client/article/:id/submit`
- 验收：用户可创建草稿、提交审核、查看投稿状态

### 后续递进

| 步骤 | 涉及文件 | 前置依赖 |
|------|---------|---------|
| 用户端文章投稿 | `ClientArticles.vue` + `ClientArticleCreate.vue` | 用户端路由已就绪 |
| AI 分析结果展示 | `ClientDiary.vue` 弹窗中展示分析结果 | 情绪日记页面完成 |
| 文章审核闭环 | 管理端审核队列 | 用户端投稿完成后 |
| 开源基础文件 | LICENSE、CHANGELOG、启动脚本 | 功能稳定后 |

### 启动方式

```bash
# 终端 1：后端
cd server && npm run dev

# 终端 2：前端
npm run dev
```
