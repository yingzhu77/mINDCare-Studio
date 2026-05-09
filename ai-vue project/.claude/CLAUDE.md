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

本项目当前定位为：

`AI 心理健康管理平台：Vue3 管理后台 + NestJS 后端 + Prisma + MySQL + DeepSeek AI 情绪分析/会话摘要`

项目长期目标是做成偏 Web SaaS 形态的开源项目，具备清晰的前后端边界、统一类型契约、可复制的本地启动流程和完整的业务闭环。

当前代码主体是 Vue3 管理后台前端，已有页面和接口调用覆盖登录鉴权、知识文章管理、咨询会话记录、情绪日记管理、数据概览等后台模块。

当前阶段不要误判项目：**后端主线已重建完成**。`server/` NestJS + Prisma 主线已覆盖全部 7 个核心实体、认证闭环、管理端业务接口和 DeepSeek AI 代理骨架。`backend/` FastAPI 早期原型已标记为 legacy，仅作迁移参考。

## 6. 当前阶段优先做什么

当前阶段优先顺序（Phase 4 → 5 → 6）：

1. **AI 分析结果前端展示**：情绪日记详情弹窗和咨询记录详情弹窗接入后端分析接口（POST/GET），展示主情绪、风险等级、建议等。
2. **文章审核闭环**：管理端新增审核队列页面，支持通过、驳回操作，完整实现 `draft → pending_review → published/rejected` 状态机。
3. **开源化准备**：LICENSE、CONTRIBUTING、CHANGELOG、启动脚本、README 截图、seed 数据增强。
4. **工程提效**：配置 Swagger、补充服务端测试、前端注册密码 minlength 校验。

完成标准：以上 4 项全部完成后，项目进入 v1.0 候选阶段。

## 7. 当前阶段不要做什么

除非用户明确要求，否则当前阶段不要直接执行这些工作：

- 继续扩展 FastAPI `backend/` 的业务模块。
- 接入真实 DeepSeek API 或写入真实 API Key（mock 模式已可用）。
- 改动与当前任务无关的前端页面。
- 引入额外的前端构建工具或状态管理库。
- 大规模重构前端现有页面样式或布局。

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

### 后端计划分层（server/）

- `server/src/main.ts`：NestJS 应用入口
- `server/src/app.module.ts`：根模块
- `server/src/common/`：统一响应、全局异常过滤、分页 DTO、JWT Guard、角色 Guard、当前用户装饰器
- `server/src/config/`：环境变量、数据库连接配置
- `server/src/auth/`：认证模块（登录、注册、JWT 签发）
- `server/src/users/`：用户管理模块
- `server/src/knowledge/`：知识文章模块
- `server/src/chat/`：咨询会话和 AI 聊天模块
- `server/src/emotion-diary/`：情绪日记模块
- `server/src/analysis/`：AI 分析模块
- `server/src/analytics/`：数据概览模块
- `server/src/upload/`：文件上传模块
- `server/src/ai/`：DeepSeek 客户端、提示词、解析器
- `server/prisma/`：schema、migration、seed

除非用户明确要求重构，否则不要打乱这套结构。

## 9. 接口稳定优先

后续 TS 后端必须优先兼容当前前端已经调用的接口路径和返回结构。

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

统一响应必须兼容当前 `src/utils/request.js` 的处理逻辑：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页统一返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 0,
    "currentPage": 1,
    "size": 10
  }
}
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
- 计划书中至少覆盖这些核心实体：
  - users
  - knowledge_categories
  - knowledge_articles
  - chat_sessions
  - chat_messages
  - emotion_diaries
  - ai_analysis_results
- 修改已有表结构前，要说明：
  - 当前表负责什么
  - 新字段为什么不能放在已有字段或已有表里
  - 是否会造成重复键、重复范式或迁移成本

## 12. AI 分析设计规则

计划书中的 AI 分析必须至少覆盖两类能力：

- 情绪日记分析：
  - 输入：日记内容、心情评分、睡眠质量、压力等级、触发因素
  - 输出：主情绪、情绪强度、情绪性质、风险等级、风险描述、专业建议、改善建议
  - 落库：保存到 AI 分析结果表，并关联情绪日记

- 咨询会话摘要：
  - 输入：某次会话下的用户和 AI 消息列表
  - 输出：会话摘要、情绪标签、风险提示、建议关注点
  - 落库：保存到 AI 分析结果表，并可回写会话摘要字段

模型调用失败时，不得阻塞核心业务查询。接口应返回已有业务数据，并让 AI 分析字段为空或标记为待分析。

## 13. 安全与部署端口

- 生产环境不能默认相信公网安全，暴露服务前必须考虑扫描、限流和访问控制。
- API Key、数据库密码、模型密钥只能放后端环境变量，不能写入前端或仓库。
- 部署时不要机械使用默认端口作为公网入口，例如数据库、管理后台、调试服务不应直接暴露。
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
- NestJS 导入检查：`cd server && npx ts-node -e "import { AppModule } from './src/app.module'; console.log('OK')"`
- 登录接口快速验证（TS 后端启动后）
- 接口返回结构检查
- 真实浏览器流程检查

如果无法验证，要明确说明原因和缺口。

本次只修改开发上下文文档时，不需要运行前端构建；应检查文档是否为 UTF-8 中文可读，并确认旧项目定位已移除。

## 16. 已接入的项目级 skills

当前仓库已经以项目级方式接入下面两个可复用 skill：

### web-design-guidelines

- 位置：`.agents/skills/web-design-guidelines`
- 用途：审查前端页面、交互、可访问性、视觉层次是否符合通用 Web 设计规范
- 适合场景：
  - 管理后台页面改版
  - 表单与错误提示优化
  - 表格、弹窗、详情页可读性检查

### playwright

- 位置：`.agents/skills/playwright`
- 用途：通过真实浏览器自动化做页面联调、流程回归、截图、交互检查
- 适合场景：
  - 页面是否能打开
  - 表单是否能输入
  - 登录后是否能进入后台
  - 表格和弹窗交互是否正常

### 使用原则

- `web-design-guidelines` 更适合"审查页面质量"。
- `playwright` 更适合"跑真实浏览器流程"。
- 这两个 skill 都是辅助工具，不改变本项目分层和接口边界。

## 17. 主计划书

当前唯一主计划书：

- `docs/project-fullstack-plan.md`

所有开发决策、阶段划分、验收标准均以该文件为准。不得同时维护多份互相矛盾的计划文档。

## 18. 会话交接 — 下一窗口继续的方向

当当前窗口关闭、下一个窗口继续时，请先读取本节内容建立上下文。

### 当前完成节点（2026-05-09 v0.5.0）

已完成 Phase 0-3，Phase 2 收尾修复完成：

**Phase 0 ✅ — TS 后端脚手架**
- NestJS + Prisma + SQLite 后端主线，全部 7 实体 migration + seed
- 统一响应、全局异常过滤、JWT 认证（兼容 `token` 头 + `Authorization: Bearer`）
- 健康检查、登录、注册、当前用户接口

**Phase 1 ✅ — 管理端页面真实化**
- 知识文章 CRUD + 分类树、咨询记录 + 消息列表、情绪日记 + 删除、Dashboard 统计
- 全部接入真实后端接口

**Phase 2 ✅ — 用户体系 + 用户端基础**
- `useAuthStore` + 角色路由守卫 + 登录按角色跳转
- `ClientLayout`、`ClientChat`（SSE 流式）、`ClientDiary`（CRUD）
- **用户端文章投稿**：`ClientArticles.vue`（列表+状态标签）、`ClientArticleCreate.vue`（创建/编辑+封面上传）
- 服务端 `ClientArticleModule`（`/api/client/article/*`）
- 🔐 注册 role 越权漏洞修复（拒绝客户端传入 role）
- 📁 上传控制器同时允许 admin+user
- ⏱ SSE 聊天 60s 超时保护
- 🗑 N+1 查询消除（sessionPage 返回 previewText）
- 🧹 `consultations.vue` 死文件清理 + `server/.env.example` 创建

**Phase 3 ✅ — DeepSeek 聊天**
- `POST /api/chat/send` SSE 流式输出
- 消息自动落库 + 会话计数
- mock AI 模式（无需 Key）

### 下一窗口第一个任务

**Phase 4：AI 分析结果前端展示。**

后端已有的 AnalysisController（`POST/GET /analysis/emotion-diary/:id`、`POST/GET /analysis/chat-session/:id`）尚未接入前端。需要：

1. `EmotionDiaryDetailDialog` — 增加「AI 分析」按钮，调用 POST 触发分析，展示返回的主情绪、强度、风险等级、专业建议
2. `SessionDetailDialog` — 增加「会话分析」按钮，展示情绪标签、摘要和风险等级
3. 缓存逻辑：已有分析结果时显示「查看分析」，不再重复触发

### 边界约束

| 可以碰 | 不要碰 |
|--------|--------|
| `src/components/EmotionDiaryDetailDialog.vue`（接入分析） | `server/` 后端 AnalysisController/Service（已完成且稳定） |
| `src/components/SessionDetailDialog.vue`（接入分析） | `backend/` FastAPI 遗留代码 |
| `src/api/admin.js`（如需要新增分析 API 函数） | 重构现有管理端布局或样式 |
| `src/views/` 管理端页面（优化分析展示） | 引入新依赖（保持 Vue3 + Element Plus + Axios + Pinia 栈） |
| `src/utils/` 分析结果格式化工具 | 改动用户端（ClientChat/Diary/Articles）非分析相关逻辑 |

### 关键设计决策

1. **SSE 聊天**：前端使用 `fetch` + `ReadableStream`（而非 EventSource），逐块解析 `data: {"type":"token","content":"..."}` SSE 事件。已有 60s `AbortController` 超时。
2. **用户端路由**：`/client/*` 允许 admin 和 user 角色，`router.beforeEach` 通过 `to.meta.roles` 统一检查。
3. **用户端情绪日记**：独立实现（而非复用管理端组件），更轻量且数据隔离明确。
4. **AI 分析不阻塞**：分析接口失败时，详情页仍展示已有业务数据，分析区域留空或标记待分析。

### 验收标准

1. `npm run build` 前端通过。
2. `cd server && npm run build` 后端通过。
3. 情绪日记详情可触发并查看 AI 分析结果。
4. 咨询记录详情可触发并查看会话分析结果。
5. 同一记录重复打开不重复调用模型（已有结果直接展示）。

### 遗留可优化项（不影响 Phase 4 推进）

- 前端注册页缺少密码 `minlength: 6` 校验
- Swagger 未配置（`@nestjs/swagger` 已安装）
- 服务端测试文件为空
- 开源化基础文件（LICENSE、CONTRIBUTING、CHANGELOG、启动脚本）
