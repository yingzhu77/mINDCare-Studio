# 任务待办 — 技术债务与后续规划

> 本文件记录当前 Phase 0-8 已完成后的待办任务，按优先级分组。
> 主计划书见 [project-fullstack-plan.md](project-fullstack-plan.md)（§19 及后续窗口）。

---

## P0 — 核心稳定性（下一窗口优先）

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 1 | SessionDetailDialog XSS 统一 | 自定义正则过滤 → DOMPurify | ⏳ 待办 |
| 2 | UploadService 异步化 | `writeFileSync` → `fs.promises.writeFile` | ⏳ 待办 |
| 3 | 异常过滤 HTTP 日志 | `AllExceptionsFilter` 对 HttpException 增加 `logger.warn` | ⏳ 待办 |
| 4 | 通知 DTO 校验 | `@Query('page')` 原始参数 → PaginationDto | ⏳ 待办 |

## P1 — 数据一致性与性能

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 5 | 管理端咨询列表 N+1 消除 | emotional.vue `fillSessionRows` 对每行发独立请求 | ⏳ 待办 |
| 6 | 分析结果事务保护 | AI 分析回写 session + 创建结果在事务外 | ⏳ 待办 |
| 7 | emotionTags 序列化统一已修复 | JSON 字符串 vs 数组在各端解析路径不一致 | ✅ 已完成 |

## P2 — 架构长期可维护

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 8 | 用户端情绪日记删除 API | 拆出独立用户端接口 + 后端所有权校验 | ⏳ 待办 |
| 9 | SQLite 原始 SQL 迁移兼容 | `analytics.service.ts` 的 `strftime`/`DATE` 函数需 MySQL 兼容（或抽象） | ⏳ 待办 |
| 10 | 路由守卫 token 读取源统一 | `router/index.js` 直接读 localStorage vs store 不同步风险 | ⏳ 待办 |

## P3 — 基础设施与环境

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 11 | Docker Compose 整合 | MySQL 8.0 + NestJS + Vue3 三容器生产级编排 | ⏳ 待办 |
| 12 | MySQL 迁移验证 | 从 SQLite 切到 MySQL，验证全部查询兼容 | ⏳ 待办 |
| 13 | 首次启动体验优化 | clone 后一键启动（数据库初始化 + seed + 环境检查） | ⏳ 待办 |
| 14 | 后端 E2E 测试增强 | 补充 supertest 覆盖核心 API 路径 | ⏳ 待办 |
| 15 | Playwright E2E 扩展 | 覆盖用户端流程（聊天、情绪日记、投稿） | ⏳ 待办 |
| 16 | CI pipeline 完善 | GitHub Actions 构建 + 测试 + lint | ⏳ 待办 |

## P4 — DeepSeek AI 与功能增强

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 17 | 真实 DeepSeek API Key 验证已完成 | 已验证 `deepseek-v4-flash` 非流式/流式/分析均正常 | ✅ 已完成 |
| 18 | API 清单文档更新 | `DeepSeek API 最小接入注意清单.md` 已更新 | ✅ 已完成 |
| 19 | 前端 API 层 TypeScript 化已完成 | `types.ts` + `admin.ts` + `client.ts` 替代 `.js` | ✅ 已完成 |
| 20 | 聊天历史管理增强 | 侧边栏、级联删除、JSON 导出（当前已完成） | ✅ 已完成 |
| 21 | AI 分析结果缓存 | 重复打开不重复调用模型（当前已实现） | ✅ 已完成 |
| 22 | Dashboard 图表完善 | 情绪月均趋势、咨询量趋势、文章发布趋势（ECharts） | ⏳ 待办 |
| 23 | 管理端 / 用户端剩余图表 | 补齐缺失的数据可视化 | ⏳ 待办 |

## P5 — 体验与质量

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 24 | 移动端适配 | 管理端/用户端基础响应式 | ⏳ 待办 |
| 25 | WebSocket 实时通知 | 替代当前轮询方案 | ⏳ 待办 |
| 26 | i18n 国际化 | 当前仅中文，增加英文支持 | ⏳ 待办 |
| 27 | 用户引导 / 新手教程 | 首次使用空状态引导 | ⏳ 待办 |

---

## 汇总

| 优先级 | 待办 | 已完成 |
|--------|------|--------|
| P0 | 4 | 0 |
| P1 | 2 | 1 |
| P2 | 3 | 0 |
| P3 | 6 | 0 |
| P4 | 2 | 4 |
| P5 | 4 | 0 |
| **合计** | **21** | **5** |

> 更新日期：2026-05-11 — 新增 DeepSeek 验证/TypeScript 化/API 清单三项已完成标记。
