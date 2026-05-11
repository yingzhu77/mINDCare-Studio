# 当前项目状态

> 由 CLAUDE.md 引用。版本变更时同步更新此文件。

## 版本号

**v2.3.1**（2026-05-12）— Phase 0-8 全部完成 + 测试深化 + 基础设施就绪。

## 测试综合

| 层级 | 测试类型 | 数量 |
|------|---------|------|
| 前端 | Vitest 单元测试 | 60 用例（10 文件） |
| 后端 | Jest 单元测试 | 119 用例（11 模块） |
| E2E | Playwright 冒烟测试 | 13 用例（smoke 8 + client-flows 5） |

## 基础设施

| 项目 | 状态 |
|------|------|
| Docker Compose | ✅ 三容器编排就绪（MySQL 8.0 + NestJS + Vue/nginx） |
| CI Pipeline | ✅ GitHub Actions（frontend lint/build/test + backend build/lint/test:unit/validate） |
| 部署文档 | ✅ `docs/deployment.md` |
| 启动脚本 | ✅ `scripts/start-dev.ps1`（Windows）+ `scripts/smoke-test.sh` |

## 当前不做什么

- 不引入 WebSocket 实时通知
- 不做系统化移动端适配
- 不做 i18n 国际化
- 不动 ECharts 图表样式
- 不动已有的 Docker Compose / MySQL schema 配置

## API Key 合规提醒

- 绝不提交真实 API Key 到仓库
- 未配置 Key 时自动降级至 Mock 模式，clone 即用
- 自用 Key 只放本地 `.env`（已加入 `.gitignore`）