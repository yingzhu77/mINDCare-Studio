# 任务待办

> 当前版本 **v2.5.0**。
> 更新日期：2026-05-13 — 基于代码实际状态全面核实。

---

## 待办

### 低优先级 — 体验与扩展

| # | 项目 | 说明 |
|---|------|------|
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
- **#13** 首次启动脚本（`scripts/start-dev.ps1` + `scripts/setup.sh`）
- **#14** 后端 E2E 测试（`server/test/app.e2e-spec.ts`，32 条，覆盖 7 个模块）
- **#15** Playwright E2E 13 条全绿（smoke 8 + client-flows 5）
- **#16** CI pipeline（frontend lint/build/test + backend build/lint/test:unit/prisma validate）
- **#18** DeepSeek API 接入文档（`docs/deepseek-integration.md`）

### P4 — AI 与功能增强 ✅

- **#17** DeepSeek API Key 真实验证（deepseek-v4-flash 非流式/流式/分析正常）
- **#19** 前端 API 层 TypeScript 化（`admin.ts` + `types.ts` + `client.ts`）
- **#20** 聊天历史管理（侧边栏 + 级联删除 + JSON 导出）
- **#21** AI 分析结果缓存（重复打开不重复调用模型）
- **#22** Dashboard ECharts 三种图表（情绪趋势 / 咨询量 / 文章发布）
- **#23** 管理端分析页 `/back/analytics`：文章阅读排行 Top 10 + 风险分布饼图

### P5 — 文章审核系统重构 ✅

- **#32** 新增 `KnowledgeArticleRevision` 修订表，合并主文章+修订的统一审核队列
- **#33** 管理端审核页重写：列表分页+统一状态管理（文章/修订双来源）
- **#34** 审核专用接口：`GET /knowledge/article/review/page`、`PUT /review/:type/:id/status`
- **#35** 文章状态过渡约束：主文章 draft/published/offline 三态，审核状态走专用接口
- **#36** 删除/下线通知作者：文章被删除或下线时自动发送通知

### P6 — 用户端文章 ✅

- **#17** DeepSeek API Key 真实验证（deepseek-v4-flash 非流式/流式/分析正常）
- **#19** 前端 API 层 TypeScript 化（`admin.ts` + `types.ts` + `client.ts`）
- **#20** 聊天历史管理（侧边栏 + 级联删除 + JSON 导出）
- **#21** AI 分析结果缓存（重复打开不重复调用模型）
- **#22** Dashboard ECharts 三种图表（情绪趋势 / 咨询量 / 文章发布）
- **#23** 管理端分析页 `/back/analytics`：文章阅读排行 Top 10 + 风险分布饼图

### P6 — 用户端文章 ✅

- **#28** 用户端"我的投稿"页面（列表 + 状态标签 + 编辑/提审/重新提交）

### 本次会话完成（v2.4.1，已提交）

- **#12** MySQL 迁移补齐 — 补写 Notification 表 + 3 个索引的 MySQL migration，追平 SQLite 侧
- **#29** 后端文章公开查询接口 — `GET /client/article/published` 分页 + 详情 + 分类树，无需认证
- **#30** 用户端知识文章浏览页 — `ClientArticleBrowse.vue` + `ClientArticleDetail.vue`，路由 `/articles` 公开访问
- **#14+** 后端 E2E 测试扩展 — 从 7 条到 32 条，覆盖 knowledge / emotion-diary / analytics / upload / client-article
- **#13+** 跨平台启动脚本 — `scripts/setup.sh`（bash），macOS/Linux 一键开发启动
- **#31** DeepSeek API 接入文档 — `docs/deepseek-integration.md`，含配置/模型/故障排查
- **#23** 管理端剩余图表 — `Analytics.vue` 阅读排行 + 风险分布，路由 `/back/analytics`

### 本次会话缺陷修复（v2.4.1，未提交）

- **#B1** 日记保存 400 错误 — `emotionTriggers` 前端发送 `string[]` 而后端 DTO 要求 `string`，发送前 `join(',')` 转换
- **#B2** 聊天"网络连接失败" — `ClientChat.vue` 直连 `fetch('http://127.0.0.1:8000/api/chat/send')` 绕过了 Vite 代理，改走相对路径 `/api/chat/send`

### 本次会话完成（v2.5.0，待提交）

- **#32** 新增 `KnowledgeArticleRevision` 修订表，合并主文章+修订的统一审核队列
- **#33** 管理端审核页重写：列表分页+统一状态管理
- **#34** 审核专用接口：`GET /knowledge/article/review/page` 等 4 个 REST 端点
- **#35** 文章状态过渡约束：draft/published/offline 三态规则化
- **#36** 删除/下线通知作者：调用 NotificationService 创建通知
- **#37** 前端 API 层 TypeScript 化 — `admin.ts` + `types.ts` 新增 `ReviewArticle` 类型
- **#38** 管理端分析页 `/back/analytics`：阅读排行 Top 10 + 风险分布饼图
- **#39** 用户端知识阅读导航：`ClientLayout.vue` + 路由 `/client/knowledge`
- **#40** 路由性能优化：移除 `router.afterEach` 非阻塞预加载
- **#B1** 日记保存 400 错误 — `emotionTriggers` 前端 `join(',')` 转换
- **#B2** 聊天"网络连接失败" — 改走 Vite 代理相对路径
