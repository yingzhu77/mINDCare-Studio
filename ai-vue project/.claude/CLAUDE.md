# CLAUDE.md

请始终使用简体中文与我对话，并在回答时保持专业、简洁。
请用中文解释，但代码中的函数名保持英文风格，注释请写中文。

本文件用于约束后续 Claude/Codex 在本仓库中的开发行为。目标不是增加复杂流程，而是减少常见的 LLM 编码失误：

- 擅自假设需求
- 代码过度设计
- 顺手乱改无关文件
- 没有明确验收标准就开始实现

这些规则参考了 `forrestchang/andrej-karpathy-skills` 的思路，并结合本项目当前阶段做了本地化约束。

## 1. 先想清楚再写

- 不要在有歧义时默默选一种解释然后直接实现。
- 如果需求存在多种合理理解，先明确写出当前假设。
- 如果用户的要求会明显破坏当前最小闭环，应先指出风险，再继续。
- 如果发现文档、代码、配置三者不一致，优先以当前真实代码为准，并同步修正文档。

## 2. 保持最小实现

- 只写完成当前目标所需的最少代码。
- 不为"未来可能会用到"提前增加抽象层、配置项或框架封装。
- 单次任务优先解决一个明确问题，不顺手扩大范围。
- 如果 50 行就能解决，不要写成 200 行。

## 3. 只做手术式改动

- 只改与当前任务直接相关的文件和代码段。
- 不要顺手重排无关格式、删除无关注释、重构无关模块。
- 如果发现无关问题，可以指出，但不要未经要求直接改掉。
- 所有改动都应能直接追溯到当前任务目标。

## 4. 目标驱动执行

- 开始实现前，先把任务转成可验证目标。
- 修改后必须给出明确验收方式，例如：
  - 运行哪个脚本
  - 检查哪个接口
  - 观察哪个字段
  - 预期看到什么结果
- 对多步任务，优先按"先打通、再验证、再扩展"的顺序推进。

## 5. 本项目当前定位

`AI 心理健康管理平台：Vue3 管理后台 + NestJS 后端 + Prisma + MySQL + DeepSeek AI 情绪分析/会话摘要`

项目长期目标是做成偏 Web SaaS 形态的开源项目，具备清晰的前后端边界、统一类型契约、可复制的本地启动流程和完整的业务闭环。

当前版本 **v2.3.1**，Phase 0-8 全部完成 + @CurrentUser 修复。

## 6. 当前阶段做什么 — Phase 0-8 已全部完成

Phase 0-8 全部完成。等待下一阶段规划。详见计划书 docs/project-fullstack-plan.md。

P6-P7-P8 继续延后（真实 DeepSeek 验证 / Playwright e2e / 剩余图表）。

## 7. 当前阶段不要做什么

除非用户明确要求，否则不要直接执行这些工作：

- 接入真实 DeepSeek API Key（mock 模式已可用）。
- 引入 WebSocket 实时通知。
- 进行前端 TypeScript 迁移。
- 重构现有页面样式或布局。
- 做移动端适配。
- 改动 Docker Compose / MySQL schema 已有配置。
- 改动 ECharts 图表样式。

## 8. 当前分层不可打乱

### 前端固定分层

- `src/main.js`：入口
- `src/App.vue`：根组件
- `src/views/`：页面级组件
- `src/components/`：复用组件
- `src/api/`：接口请求封装
- `src/utils/`：业务工具函数
- `src/router/`：路由与鉴权控制
- `src/store/`：状态管理

### 后端分层（server/）

- `server/src/main.ts`：NestJS 应用入口
- `server/src/app.module.ts`：根模块
- `server/src/common/`：统一响应、全局异常过滤、分页 DTO、JWT Guard、角色 Guard、当前用户装饰器
- `server/src/config/`：环境变量、数据库连接配置
- `server/src/auth/`：认证模块
- `server/src/users/`：用户管理
- `server/src/knowledge/`：知识文章
- `server/src/client-article/`：用户端投稿
- `server/src/chat/`：咨询会话 + AI 聊天
- `server/src/emotion-diary/`：情绪日记
- `server/src/analysis/`：AI 分析
- `server/src/analytics/`：数据统计
- `server/src/upload/`：文件上传
- `server/src/ai/`：DeepSeek 客户端
- `server/prisma/`：schema、migration、seed

除非用户明确要求重构，否则不要打乱这套结构。

## 9. 接口稳定优先

后端必须优先兼容当前前端已经调用的接口路径和返回结构。

当前前端通过 `src/api/admin.js` 调用的核心接口包括：

- `POST /user/login`
- `GET /knowledge/category/tree`
- `GET /knowledge/article/page`
- `POST /knowledge/article`
- `PUT /knowledge/article`
- `GET /knowledge/article/{id}`
- `DELETE /knowledge/article/{id}`
- `PUT /knowledge/article/{id}/status`
- `POST /file/upload`
- `GET /psychological-chat/sessions`
- `GET /psychological-chat/sessions/{sessionId}/messages`
- `GET /psychological-chat/sessions/{sessionId}`
- `GET /psychological-chat/session/{sessionId}/emotion`
- `GET /emotion-diary/admin/page`
- `DELETE /emotion-diary/admin/{id}`
- `GET /data-analytics/overview`
- `GET /data-analytics/trends?type=emotion|session|article`
- `POST /analysis/emotion-diary/{id}`
- `GET /analysis/emotion-diary/{id}`
- `POST /analysis/chat-session/{id}`
- `GET /analysis/chat-session/{id}`

统一响应格式：

```json
{"code": 200, "message": "success", "data": {}}
```

分页返回：

```json
{"code": 200, "message": "success", "data": {"records": [], "total": 0, "currentPage": 1, "size": 10}}
```

在没有明确需求前，不要把接口改成新的路径，也不要要求前端大规模调整请求层。

## 10. 模型接入规则

- 模型 API Key 只能放后端环境变量，不得写入前端或提交到仓库。
- 前端不能直接调用模型 API。
- 正确链路是：`前端 -> 本项目 NestJS 后端 -> DeepSeek API`。
- 如果示例文件或脚本中需要展示环境变量，必须留空或写占位值，不得提交真实密钥。
- AI 分析结果应优先由后端落库，前端只展示后端返回结果，避免每次打开详情都重复调用模型。
- 支持 mock AI 模式：当 API Key 未配置时，返回模拟分析结果，确保本地演示不依赖外部服务。

## 11. 数据库设计规则

- 使用 Prisma schema 定义所有数据模型，通过 migration 管理表结构变更。
- 不再依赖自动建表或 `sync()` 方式。
- 新增数据库表之前，必须先说明实体关系和业务流程。
- 计划书中至少覆盖这些核心实体：users、knowledge_categories、knowledge_articles、chat_sessions、chat_messages、emotion_diaries、ai_analysis_results。
- 修改已有表结构前，要说明：当前表负责什么、新字段为什么不能放在已有字段或已有表里、是否会造成重复键或迁移成本。

## 12. AI 分析设计规则

- 情绪日记分析：输入（内容、评分、睡眠、压力、触发因素）→ 输出（主情绪、强度、性质、风险等级、建议），结果落库。
- 咨询会话摘要：输入（消息列表）→ 输出（摘要、情绪标签、风险提示），结果落库。
- 模型调用失败时，不得阻塞核心业务查询。

## 13. 安全与部署端口

- 生产环境不能默认相信公网安全，暴露服务前必须考虑扫描、限流和访问控制。
- API Key、数据库密码、模型密钥只能放后端环境变量，不能写入前端或仓库。
- 部署时不要机械使用默认端口作为公网入口。
- 对外暴露的端口、CORS 域名、管理接口、上传接口都必须在部署说明里明确写清楚。
- 本地开发端口可以保持简单，但生产端口和访问入口必须单独配置。

## 14. 注释与可读性

- 项目内新增说明性注释优先使用中文，面向初学者可读。
- 注释只解释"为什么这样做"或"这一段在流程里负责什么"。
- 不要写同义反复型注释。

## 15. 验收习惯

完成改动后尽量至少做一项验证：

- 前端构建检查：`npm run build`
- NestJS 构建检查：`cd server && npm run build`
- Prisma 迁移状态：`npx prisma migrate status`
- 登录接口快速验证（TS 后端启动后）
- 接口返回结构检查
- 真实浏览器流程检查

如果无法验证，要明确说明原因和缺口。

## 16. 已接入的项目级 skills

### web-design-guidelines
- 位置：`.agents/skills/web-design-guidelines`
- 用途：审查前端页面、交互、可访问性、视觉层次

### playwright
- 位置：`.agents/skills/playwright`
- 用途：真实浏览器自动化联调、回归、截图

使用原则：辅助工具，不改变本项目分层和接口边界。

## 17. 主计划书

当前唯一主计划书：
- `docs/project-fullstack-plan.md`

所有开发决策、阶段划分、验收标准均以该文件为准。不得同时维护多份互相矛盾的计划文档。

## 18. 当前状态（2026-05-10 v2.3.1）

Phase 0-8 全部完成。@CurrentUser 误用修复 + logs.vue CSS 清理。

### 已完成（累计）

| 优先级 | 内容 |
|--------|------|
| Phase 0-6 | 核心 7 实体、认证闭环、管理端/用户端业务、DeepSeek AI、审核通知、开源交付 |
| 限流与安全 | @nestjs/throttler 全局限流 + 上传白名单 |
| MySQL 迁移 | prisma/mysql/schema.prisma 就绪 + 生产环境变量模板 |
| Docker Compose | MySQL 8.0 + NestJS + Vue3 三容器编排 |
| wangEditor 分割 | defineAsyncComponent 动态导入，独立 chunk |
| 审核通知 | Notification 模型 + 迁移 + CRUD + 前端铃铛轮询 |
| 聊天历史管理 | 侧边栏 + 级联删除 + JSON 导出 + E2E 测试 |
| **v2.0 收口** | **XSS 修复、emotional.vue 精简、Vitest 骨架(33 用例)、el-empty 统一、logger 迁移** |
| **Phase 7** | **Dashboard ECharts 图表、GitHub Actions CI、后端 15 新用例、部署文档** |
| **Phase 8** | **P0 前端组件测试(8 用例) + P1 后端测试深化(27 新用例) + P2 Playwright E2E 骨架 + P3 搜索筛选体验统一** |

### 当前状态

Phase 0-8 全部完成。技术债务优化项已列入计划（docs/project-fullstack-plan.md §19），待后续窗口处理。

### 测试综合

| 层级 | 测试类型 | 数量 |
|------|---------|------|
| 前端 | Vitest 单元测试 | 41 用例（4 utils + 3 组件） |
| 后端 | Jest 单元测试 | 52 用例（5 模块） |
| E2E | Playwright 冒烟测试 | 3 用例（登录→Dashboard→未登录重定向） |

### 当前不做什么

- 不接入真实 DeepSeek API Key
- 不引入 WebSocket 实时通知
- 不进行前端 TypeScript 迁移
- 不做移动端适配
- 不动 Docker Compose / MySQL schema

## 19. API Key 合规规则

在开放源代码的仓库中工作必须遵守以下规则：

1. **绝不提交真实 API Key**：`.env`、`.env.production`、任何配置文件中不得出现真实 Key
2. **绝不硬编码测试用 Key**：自用 Key 只放在本地 `.env`（已加入 `.gitignore`）
3. **Mock 模式作为兜底**：未配置 Key 时自动降级至 Mock 模式，确保 clone 即用
4. **启动提示**：`scripts/start-dev.ps1` 在启动时检测 Key 配置状态并提示用户
5. **README 说明**：明确告知用户"使用前需自行申请并配置 API Key"

## 20. 技术债务状态（v2.3.1 已全部解决）

详见 `docs/project-fullstack-plan.md` §19。**全部 11 项已在 v2.3.1 中解决：**

### P0 核心稳定性 ✅
- SessionDetailDialog XSS → DOMPurify
- UploadService 异步化 → fs/promises
- 异常过滤 HTTP 日志 → 已按级别记录
- 通知 DTO 校验 → PaginationDto

### P1 数据一致性+性能 ✅
- 管理端咨询列表 N+1 → 后端单次 `findMany`+`include`
- 分析结果事务保护 → `$transaction` 包装
- emotionTags 序列化统一 → `json-helper.ts`

### P2 架构可维护 ✅
- 用户端情绪日记独立删除 API → 客户端独立接口
- SQLite 原始 SQL → Prisma 聚合+内存聚合
- 路由守卫 token 读取源 → 统一 Pinia store

## 21. 进度同步规则

每次推进项目（完成一个或多个 Phase 任务）后必须执行以下操作：

1. **更新主计划书** `docs/project-fullstack-plan.md`：
   - 更新第 2 节"当前状态"的版本号和阶段标记
   - 在前端/后端描述中加入新增功能
   - 将已完成的 Phase 从"当前窗口"移入"已完成"列表
   - 补齐"当前遗留问题"（删除已解决的，加入新出现的）
   - 将"下一窗口"重新编号为正确的新序号

2. **更新 CLAUDE.md 自身**：
   - 更新第 5 节版本号（v2.x.x）
   - 更新第 6 节"当前阶段做什么"为下一窗口任务
   - 更新第 7 节"当前阶段不要做什么"
   - 更新第 18 节"当前状态"（已完成累计 + 当前窗口 + 不做什么）
   - 如果新增了接口，同步更新第 9 节接口列表

3. **验证**：
   - 修改后执行 `npm run build`（前端）和 `cd server && npm run build`（后端）确保构建不坏
   - 执行 `npm run test` 和 `cd server && npm run test` 确保测试通过

此规则自动化了"做完功能 → 同步文档 → 验证"的闭环，避免出现功能做了但文档停留在旧版本的情况。
