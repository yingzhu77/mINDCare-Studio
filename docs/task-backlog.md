# 任务待办 — 后续规划与已完成记录

> 本文件记录当前 Phase 0-8 完成后的剩余待办与历史完成项。
> 主计划书见 [project-fullstack-plan.md](project-fullstack-plan.md)。
> 当前版本 **v2.3.1**，P0-P2 技术债务已全部解决。

---

## 待办任务

### P3 — 基础设施与环境

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 11 | Docker Compose 整合 | MySQL 8.0 + NestJS + Vue3 三容器生产级编排 | ⏳ 待办 |
| 12 | MySQL 迁移验证 | 从 SQLite 切到 MySQL，验证全部查询兼容 | ⏳ 待办 |
| 13 | 首次启动体验优化 | clone 后一键启动（数据库初始化 + seed + 环境检查） | ⏳ 待办 |
| 14 | 后端 E2E 测试增强 | 补充 supertest 覆盖核心 API 路径 | ⏳ 待办 |
| 15 | Playwright E2E 扩展 | 覆盖用户端流程（聊天、情绪日记、投稿） | ⏳ 待办 |
| 16 | CI pipeline 完善 | GitHub Actions 构建 + 测试 + lint | ⏳ 待办 |

### P4 — DeepSeek AI 与功能增强

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 22 | Dashboard 图表完善 | 情绪月均趋势、咨询量趋势、文章发布趋势（ECharts） | ⏳ 待办 |
| 23 | 管理端 / 用户端剩余图表 | 补齐缺失的数据可视化 | ⏳ 待办 |

### P5 — 体验与质量

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 24 | 移动端适配 | 管理端/用户端基础响应式 | ⏳ 待办 |
| 25 | WebSocket 实时通知 | 替代当前轮询方案 | ⏳ 待办 |
| 26 | i18n 国际化 | 当前仅中文，增加英文支持 | ⏳ 待办 |
| 27 | 用户引导 / 新手教程 | 首次使用空状态引导 | ⏳ 待办 |

### P6 — 客户端文章浏览

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 28 | 客户端已上线文章浏览 | 用户端导航新增"知识文章"入口（情绪日记与文章投稿之间），展示管理端已上线的知识文章列表，支持分类筛选和点击查看详情 | 📋 已计划 |
| 29 | 后端文章公开查询接口 | 新增 `GET /client/article/published` 分页接口（仅返回 `status=published` 的文章）+ `GET /client/article/published/:id` 详情接口，无需认证或使用 user 角色认证 | 📋 已计划 |
| 30 | 前端文章列表与详情页 | `ClientArticlesView.vue` 文章列表页（卡片布局 + 分类筛选）+ `ClientArticleDetail.vue` 详情页（Markdown 渲染），接入新 API | 📋 已计划 |

---

## 已完成（v2.3.1）

### P0 — 核心稳定性 ✅

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 1 | SessionDetailDialog XSS 统一 | 自定义正则过滤 → DOMPurify | ✅ 已完成 |
| 2 | UploadService 异步化 | `writeFileSync` → `fs.promises.writeFile` | ✅ 已完成 |
| 3 | 异常过滤 HTTP 日志 | `AllExceptionsFilter` 对 HttpException 增加 `logger.warn` | ✅ 已完成 |
| 4 | 通知 DTO 校验 | `@Query('page')` 原始参数 → PaginationDto | ✅ 已完成 |

### P1 — 数据一致性与性能 ✅

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 5 | 管理端咨询列表 N+1 消除 | emotional.vue `fillSessionRows` 对每行发独立请求 | ✅ 已完成 |
| 6 | 分析结果事务保护 | AI 分析回写 session + 创建结果在事务外 | ✅ 已完成 |
| 7 | emotionTags 序列化统一已修复 | JSON 字符串 vs 数组在各端解析路径不一致 | ✅ 已完成 |

### P2 — 架构长期可维护 ✅

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 8 | 用户端情绪日记删除 API | 拆出独立用户端接口 + 后端所有权校验 | ✅ 已完成 |
| 9 | SQLite 原始 SQL 迁移兼容 | `analytics.service.ts` 的 `strftime`/`DATE` 函数需 MySQL 兼容（或抽象） | ✅ 已完成 |
| 10 | 路由守卫 token 读取源统一 | `router/index.js` 直接读 localStorage vs store 不同步风险 | ✅ 已完成 |

### P4 — DeepSeek AI 与功能增强 ✅

| # | 项目 | 说明 | 状态 |
|---|------|------|------|
| 17 | 真实 DeepSeek API Key 验证已完成 | 已验证 `deepseek-v4-flash` 非流式/流式/分析均正常 | ✅ 已完成 |
| 18 | API 清单文档更新 | `DeepSeek API 最小接入注意清单.md` 已更新 | ✅ 已完成 |
| 19 | 前端 API 层 TypeScript 化已完成 | `types.ts` + `admin.ts` + `client.ts` 替代 `.js` | ✅ 已完成 |
| 20 | 聊天历史管理增强 | 侧边栏、级联删除、JSON 导出（当前已完成） | ✅ 已完成 |
| 21 | AI 分析结果缓存 | 重复打开不重复调用模型（当前已实现） | ✅ 已完成 |

---

## 汇总

| 优先级 | 待办 | 已完成 |
|--------|------|--------|
| P0 | 0 | 4 |
| P1 | 0 | 3 |
| P2 | 0 | 3 |
| P3 | 6 | 0 |
| P4 | 2 | 5 |
| P5 | 4 | 0 |
| P6 | 3 | 0 |
| **合计** | **15** | **15** |

> 更新日期：2026-05-11 — P0-P2 技术债务项已全部移入"已完成"；P3/P4/P5 待办保持不变。
