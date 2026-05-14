# 当前项目状态

> 由 CLAUDE.md 引用。版本变更时同步更新此文件。

## 版本号

**v2.6.0**（2026-05-14）— 正式开源版本。

## 功能模块总览

| 模块 | 角色 | 状态 | 说明 |
|------|------|------|------|
| 首页 | 公共 | ✅ | 功能入口卡片 + 关于区域，暖薰衣草紫主题 |
| 登录/注册 | 公共 | ✅ | 左侧 logo + 暖金色诗意文案，JWT 认证，admin/user 角色分离 |
| Dashboard | 管理端 | ✅ | ECharts 趋势图（情绪/咨询/文章）、统计概览 |
| 知识文章 | 管理端 | ✅ | 分类树 + CRUD + 富文本编辑（wangEditor）、发布/下线/重新发布 |
| 文章审核 | 管理端 | ✅ | 主文章 + 修订统一审核队列、修订版提审/审核/驳回、通知作者 |
| 咨询记录 | 管理端 | ✅ | 会话列表 + 消息查看 |
| 情绪日志 | 管理端 | ✅ | 用户情绪日记管理端分页 + 删除 |
| 数据洞察 | 管理端 | ✅ | 分析页面（阅读排行 + 风险分布 + SEIQ 评分统计） |
| 用户管理 | 管理端 | ✅ | 用户列表分页 + 启用/禁用 |
| 通知铃铛 | 管理端 | ✅ | 待审核红点 + 通知列表 + 已读标记，60 秒轮询 |
| AI 聊天 | 用户端 | ✅ | SSE 流式回复、会话侧边栏、删除/导出、DeepSeek v4-Flash |
| 情绪日记 | 用户端 | ✅ | CRUD + 情绪评分/睡眠/压力/触发因素 + 情绪洞察图表 |
| 情绪洞察 | 用户端 | ✅ | 趋势折线图、情绪分布饼图、压力与睡眠对比柱状图、触发因素分析 |
| 文章投稿 | 用户端 | ✅ | 投稿/编辑/提交审核、支持修订版 |
| 知识阅读 | 用户端 | ✅ | 文章浏览 + 详情页 |
| 多语言 | 全平台 | ✅ | 简体中文/繁体中文/英文，vue-i18n，浏览器自动检测 |

## 技术栈

**前端：** Vue3 + Vite + Element Plus + Axios + Pinia + Vue Router + wangEditor + ECharts

**后端：** NestJS + Prisma + MySQL（开发期 SQLite）+ JWT + Swagger

**AI：** DeepSeek API（兼容 OpenAI 格式），后端代理 + SSE 流式，Mock AI 演示模式

**桌面：** Electron + electron-builder（NSIS/portable 双目标）

## 基础设施

| 项目 | 状态 | 说明 |
|------|------|------|
| Docker Compose | ✅ | 三容器编排（MySQL 8.0 + NestJS + Vue/nginx） |
| CI Pipeline | ✅ | GitHub Actions（lint/build/test/validate） |
| Playwright E2E | ✅ | 14 用例（smoke + client-flows） |
| 部署文档 | ✅ | `docs/deployment.md`（Docker + Nginx SSL + 安全加固） |
| 启动脚本 | ✅ | `scripts/start-dev.ps1`（Windows）+ `scripts/setup.sh`（macOS/Linux） |
| API 文档 | ✅ | `docs/deepseek-integration.md` |

## 测试覆盖

| 层级 | 类型 | 数量 |
|------|------|------|
| 前端 | Vitest 单元测试 | 60 用例（10 文件） |
| 后端 | Jest 单元测试 | 113 用例（10 模块） |
| 后端 | Jest E2E 测试 | 32 用例（7 模块） |
| E2E | Playwright 冒烟测试 | 14 用例 |

## 多语言支持

- 支持语言：简体中文（zh）、繁体中文（zh-TW）、英文（en）
- 实现方式：vue-i18n，`legacy: false` 模式
- 翻译范围：导航菜单、按钮、标签、提示信息等 UI 框架文字
- 浏览器自动检测：`zh-TW`/`zh-HK`/`zh-MO` 自动加载繁体，`en` 加载英文，其余默认简体
- 用户生成内容（文章、日记、聊天消息）保持原语言不变

## API Key 合规

- 绝不提交真实 API Key 到仓库
- 未配置 Key 时自动降级至 Mock 模式，clone 即用
- 自用 Key 只放本地 `.env`（已加入 `.gitignore`）
