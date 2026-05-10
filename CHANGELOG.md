# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 和 [语义化版本](https://semver.org/)。

## [v1.0.0-rc] - 2026-05-09

### 新增

- **开源化准备**：添加 MIT LICENSE、CONTRIBUTING.md、CHANGELOG.md
- **一键启动脚本**：`scripts/start-dev.ps1` 同时启动前端 + 后端
- **Swagger 文档**：`/api/docs` 可浏览所有 API 列表，支持 Bearer Token 调试
- **服务端 e2e 测试**：覆盖健康检查 + 登录认证流程
- **Seed 数据增强**：预置测试用户、示例文章、情绪日记、聊天记录

### 工程提效

- 配置 `@nestjs/swagger` 全局注册，标题/描述/版本/Bearer Auth 完备
- 集成 Jest + ts-jest + supertest 测试框架
- `README.md` 增加技术栈徽章、功能清单、截图区域

---

## [v0.5.0] - 2026-05-09

### 新增

- **AI 分析前端展示**：情绪日记详情弹窗展示主情绪、强度、风险等级、专业建议
- **咨询会话摘要展示**：会话详情弹窗展示摘要、情绪标签、风险等级
- **用户端文章投稿**：`ClientArticles.vue` + `ClientArticleCreate.vue`，支持创建/编辑/封面上传
- **后端新增模块**：`ClientArticleModule`，`/api/client/article/*` 路由
- **完整文章状态机**：`draft → pending_review → published/rejected → re-submit`

### 修复

- 注册接口 role 越权漏洞（拒绝客户端传入 role）
- 上传控制器同时允许 admin + user 角色
- SSE 聊天 60s 超时保护
- 消除 N+1 查询（sessionPage 返回 previewText）
- 死文件清理（`consultations.vue`）

### 文档

- 更新 CLAUDE.md 至 Phase 5 完成状态

---

## [v0.4.0] - 2026-05-08

### 新增

- **用户端布局**：ClientLayout 带角色路由守卫
- **AI 聊天**：SSE 流式输出，消息自动落库 + 会话计数
- **情绪日记**：用户端情绪日记 CRUD
- 注册页接入真实后端接口

---

## [v0.3.0] - 2026-05-08

### 新增

- **NestJS 后端主线重建**：全部 7 个实体 + Prisma Migration + Seed
- **认证闭环**：JWT 登录/注册，兼容 `token` + `Authorization: Bearer`
- **管理端接口**：知识文章 CRUD + 分类树、咨询记录 + 消息、情绪日记管理、Dashboard 统计
- **AI 模块骨架**：DeepSeek 客户端 + Mock 模式
- **useAuthStore**：Pinia 状态管理，角色路由守卫，按角色跳转
- **管理端页面真实化**：全部接入真实后端接口

### 架构变更

- 后端从 FastAPI 迁移至 NestJS + Prisma + SQLite
- 统一的 NestJS 模块分层（auth/users/knowledge/chat/emotion-diary/analysis/analytics/upload/ai）

---

## [v0.2.0] - 2026-04-13

### 新增

- 前端页面：知识文章管理、咨询记录、情绪日志管理
- API 模块封装和路由配置
- 开发代理配置

## [v0.1.0] - 2026-04-11

### 新增

- 项目初始化：Vue 3 + Vite + Element Plus + Pinia + Vue Router
- 管理后台基础布局
- 登录页 UI

## 模板

[Unreleased]: https://github.com/yingzhu77/ai-vue/compare/v1.0.0-rc...HEAD
[v1.0.0-rc]: https://github.com/yingzhu77/ai-vue/compare/v0.5.0...v1.0.0-rc
[v0.5.0]: https://github.com/yingzhu77/ai-vue/compare/v0.4.0...v0.5.0
[v0.4.0]: https://github.com/yingzhu77/ai-vue/compare/v0.3.0...v0.4.0
[v0.3.0]: https://github.com/yingzhu77/ai-vue/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/yingzhu77/ai-vue/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/yingzhu77/ai-vue/releases/tag/v0.1.0
