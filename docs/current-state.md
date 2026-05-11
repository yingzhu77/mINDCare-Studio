# 当前项目状态

> 由 CLAUDE.md 引用。版本变更时同步更新此文件。

## 版本号

**v2.3.1**（2026-05-10）— Phase 0-8 全部完成 + @CurrentUser 修复。

## 已完成 Phase（摘要）

| Phase | 内容 |
|-------|------|
| Phase 0-6 | 核心 7 实体、认证闭环、管理端/用户端业务、DeepSeek AI 分析、审核通知、开源交付 |
| Phase 7 | Dashboard ECharts 图表、GitHub Actions CI、后端 15 新用例、部署文档 |
| Phase 8 | P0 前端组件测试(8 用例) + P1 后端测试深化(27 新用例) + P2 Playwright E2E 骨架 + P3 搜索筛选体验统一 |

## 测试综合

| 层级 | 测试类型 | 数量 |
|------|---------|------|
| 前端 | Vitest 单元测试 | 41 用例（4 utils + 3 组件） |
| 后端 | Jest 单元测试 | 52 用例（5 模块） |
| E2E | Playwright 冒烟测试 | 3 用例（登录→Dashboard→未登录重定向） |

## 当前遗留问题

| 类型 | 问题 | 影响 |
|------|------|------|
| 缺失 | 真实 DeepSeek API Key 验证 | Mock 模式已可用，无需 Key |
| 缺失 | i18n 国际化支持 | 仅中文界面 |

## 当前不做什么

- 不接入真实 DeepSeek API Key（mock 模式已可用）
- 不引入 WebSocket 实时通知
- 不进行前端 TypeScript 迁移
- 不做移动端适配
- 不动 Docker Compose / MySQL schema 已有配置
- 不动 ECharts 图表样式

## API Key 合规提醒

- 绝不提交真实 API Key 到仓库
- 未配置 Key 时自动降级至 Mock 模式，clone 即用
- 自用 Key 只放本地 `.env`（已加入 `.gitignore`）
