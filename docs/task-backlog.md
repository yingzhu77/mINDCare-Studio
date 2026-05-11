# 任务待办

> 当前版本 **v2.3.1**。P0-P2 技术债务已全部解决。
> 更新日期：2026-05-12 — 基于代码实际状态全面核实。

---

## 待办

### 高优先级 — 数据库补齐与功能闭环

| # | 项目 | 说明 |
|---|------|------|
| 12 | MySQL 迁移补齐 | 补写 Notification 表 + 3 个索引的 MySQL migration，追平 SQLite 侧 3 个 migration |
| 29 | 后端文章公开查询接口 | 新增 `GET /client/article/published` 分页 + `GET /client/article/published/:id` 详情，无需认证 |
| 30 | 用户端知识文章浏览页 | 新建 `ClientArticleBrowse.vue`：卡片列表 + 分类筛选 + 详情页，接入 #29 接口 |

### 中优先级 — 基础设施增强

| # | 项目 | 说明 |
|---|------|------|
| 14+ | 后端 E2E 测试扩展 | 当前仅 7 条（health/login/chat），补充 knowledge / emotion-diary / analytics / upload 的 supertest 覆盖 |
| 13+ | 跨平台启动脚本 | 补写 `setup.sh`（bash），与现有 `start-dev.ps1`（PowerShell）并行，覆盖 macOS/Linux |
| 18 | DeepSeek API 接入文档 | 编写接入注意事项、模型选择、mock 模式说明、故障排查清单 |

### 低优先级 — 体验与扩展

| # | 项目 | 说明 |
|---|------|------|
| 23 | 管理端剩余图表 | 补齐除 Dashboard 外的数据可视化（如用户活跃度、文章阅读排行等） |
| 27 | 新手引导 | 首次使用空状态引导、操作提示 |
| 24 | 移动端适配 | 当前 6 个文件有零散 media query，需系统化响应式布局 |
| 25 | WebSocket 实时通知 | 替代当前轮询方案 |
| 26 | i18n 国际化 | 当前仅中文，增加英文支持 |

---

## 已完成

### P0 — 核心稳定性 ✅

- **#1** SessionDetailDialog XSS → DOMPurify
- **#2** UploadService 异步化 → `fs.promises.writeFile`
- **#3** 异常过滤 HTTP 日志 → `AllExceptionsFilter` 增加 `logger.warn`
- **#4** 通知 DTO 校验 → `@Query('page')` 改用 PaginationDto

### P1 — 数据一致性与性能 ✅

- **#5** 管理端咨询列表 N+1 消除
- **#6** 分析结果事务保护
- **#7** emotionTags 序列化统一

### P2 — 架构长期可维护 ✅

- **#8** 用户端情绪日记删除 API + 所有权校验
- **#9** SQLite 原始 SQL → MySQL 兼容抽象
- **#10** 路由守卫 token 读取源统一

### P3 — 基础设施 ✅

- **#11** Docker Compose 三容器编排（MySQL + NestJS + Vue/nginx）
- **#13** 首次启动脚本（`scripts/start-dev.ps1` + `scripts/smoke-test.sh`）
- **#14** 后端 E2E 测试骨架（`server/test/app.e2e-spec.ts`，7 条 supertest）
- **#15** Playwright E2E 13 条全绿（smoke 8 + client-flows 5）
- **#16** CI pipeline（frontend lint/build/test + backend build/lint/test:unit/prisma validate）

### P4 — AI 与功能增强 ✅

- **#17** DeepSeek API Key 真实验证（deepseek-v4-flash 非流式/流式/分析正常）
- **#19** 前端 API 层 TypeScript 化（`admin.ts` + `types.ts` + `client.ts`）
- **#20** 聊天历史管理（侧边栏 + 级联删除 + JSON 导出）
- **#21** AI 分析结果缓存（重复打开不重复调用模型）
- **#22** Dashboard ECharts 三种图表（情绪趋势 / 咨询量 / 文章发布）

### P6 — 用户端文章 ✅

- **#28** 用户端"我的投稿"页面（列表 + 状态标签 + 编辑/提审/重新提交）

### 本次会话新增（未提交）

- 后端 4 模块单元测试：KnowledgeService 15 条、UsersService 8 条、AnalyticsService 7 条、UploadService 5 条
- 前端 3 模块测试：useAuthStore 9 条、useMenuStore 3 条、路由守卫 7 条
- E2E 限流修复：`E2EThrottlerGuard` + Playwright env `THROTTLE_LIMIT`
- E2E 选择器修复：`getByRole('heading')` 替代 `getByText` 避免多元素匹配