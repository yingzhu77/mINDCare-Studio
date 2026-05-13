# 任务待办

> 当前版本 **v2.5.1**。
> 更新日期：2026-05-13 — 基于代码实际状态全面核实。

---

## 待办

### 低优先级 — 体验与扩展

| # | 项目 | 说明 |
|---|------|------|
| 25 | WebSocket 实时通知 | 替代当前轮询方案 |
| 26 | i18n 国际化 | 当前仅中文，增加英文支持 |
| 55 | UI/UX 专业化重构 | 使用 UI UX Pro Max skill，在保留功能前提下重构健康助手视觉与交互 |

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

### P3 — 基础设施与体验 ✅

- **#11** Docker Compose 三容器编排（MySQL + NestJS + Vue/nginx）
- **#12** MySQL 迁移补齐 — Notification 表 + 3 个索引的 MySQL migration
- **#24** 移动端系统化响应式布局 — 19 个文件含 media query（登录/导航/表格/聊天/弹窗）
- **#27** 新手引导与空状态 — ClientDiary/ClientArticles/ClientChat/Dashboard 等页面空状态插图+引导按钮
- **#13** 首次启动脚本（`scripts/start-dev.ps1` + `scripts/setup.sh`）
- **#14** 后端 E2E 测试（`server/test/app.e2e-spec.ts`，32 条，覆盖 7 个模块）
- **#15** Playwright E2E 14 条全绿（smoke 8 + client-flows 6）
- **#16** CI pipeline（frontend lint/build/test + backend build/lint/test:unit/prisma validate）
- **#18** DeepSeek API 接入文档（`docs/deepseek-integration.md`）
- **#29** 后端文章公开查询接口 — `GET /client/article/published` 分页 + 详情 + 分类树
- **#30** 用户端知识文章浏览页 — `ClientArticleBrowse.vue` + `ClientArticleDetail.vue`

### P4 — AI 与功能增强 ✅

- **#17** DeepSeek API Key 真实验证（deepseek-v4-flash 非流式/流式/分析正常）
- **#19** 前端 API 层 TypeScript 化（`admin.ts` + `types.ts` + `client.ts`）
- **#20** 聊天历史管理（侧边栏 + 级联删除 + JSON 导出）
- **#21** AI 分析结果缓存（重复打开不重复调用模型）
- **#22** Dashboard ECharts 三种图表（情绪趋势 / 咨询量 / 文章发布）
- **#23** 管理端分析页 `/back/analytics`：阅读排行 Top 10 + 风险分布饼图 + SEIQ 评分统计
- **#31** DeepSeek API 接入文档 `docs/deepseek-integration.md`
- **#B1** 日记保存 400 错误修复 — `emotionTriggers` 前端 `join(',')` 转换
- **#B2** 聊天网络连接失败修复 — 改走 Vite 代理相对路径

### P5 — 文章审核系统重构 ✅

- **#32** 新增 `KnowledgeArticleRevision` 修订表，合并主文章+修订的统一审核队列
- **#33** 管理端审核页重写：列表分页+统一状态管理（文章/修订双来源）
- **#34** 审核专用接口：`GET /knowledge/article/review/page` 等 4 个 REST 端点
- **#35** 文章状态过渡约束：主文章 draft/published/offline 三态，审核状态走专用接口
- **#36** 删除/下线通知作者：文章被删除或下线时自动发送通知

### P6 — 用户端文章 ✅

- **#28** 用户端"我的投稿"页面（列表 + 状态标签 + 编辑/提审/重新提交）
- **#39** 用户端知识阅读导航：`ClientLayout.vue` + 路由 `/client/knowledge`
- **#40** 路由性能优化：移除 `router.afterEach` 非阻塞预加载

### P7 — 管理端权限精细化 ✅

- **#41** 管理员自建文章 vs 用户投稿区分：作者列添加"自建"标签
- **#42** 后端 `updateArticle` 收紧：仅管理员自建文章可编辑，用户投稿一律拒绝
- **#43** 审核页仅显示用户投稿：`reviewPage`/`pendingReviewCount` 过滤管理员文章
- **#44** 审核页新增删除按钮：支持删除主文章和修订记录
- **#45** 新增 `DELETE /knowledge/article/review/revision/:id` 修订删除接口
- **#46** 下线/删除操作分两套交互：管理员自建仅二次确认，用户投稿需填原因
- **#47** 知识文章页新增"使用须知"按钮与弹窗

### P8 — 文章审核体验收口 ✅

- **#48** 修复知识文章发布/下线 `isPublish` 运行时错误
- **#49** 知识文章列表新增状态列与按状态分流操作按钮
- **#50** 管理端知识文章新增查看弹窗，详情按需拉取正文并用 DOMPurify 净化
- **#51** 审核红点改为 `useReviewStore` 全局状态，审核操作后即时刷新
- **#52** 登录页去重提交入口，增加 loading 防重入与 `router.replace`
- **#53** 文章列表接口瘦身：`articlePage()` 排除 `content`
- **#54** 下线/删除用户文章原因透传并创建通知，`offline -> published` 支持重新发布
