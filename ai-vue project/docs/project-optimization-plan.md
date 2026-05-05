# AI 心理健康管理平台项目优化计划书

生成日期：2026-05-05

## 1. 项目定位

本项目优化目标是将当前 Vue3 管理后台扩展为一个具备完整业务闭环的 AI 心理健康管理平台。

目标技术栈：

- 前端：Vue3 + Vite + Element Plus + Axios + Pinia
- 后端：FastAPI + SQLAlchemy/SQLModel + JWT
- 数据库：MySQL
- AI 能力：情绪日记分析、咨询会话摘要、风险等级识别
- 接口形态：优先兼容当前前端已接入接口，减少前端重构成本

本阶段目标不是立即开发全部后端功能，而是明确后续实现路径、模块边界、数据库结构、AI 分析流程和验收标准。

## 2. 当前前端基础

当前前端已经具备后台管理系统的主要页面和接口调用边界：

- 登录鉴权：`/auth/login` 登录页、token 本地存储、后台路由守卫。
- 后台布局：左侧菜单、顶部栏、二级路由出口、页面切换动画。
- 知识文章管理：文章分页、分类筛选、新增、编辑、删除、上下线、封面上传、富文本编辑。
- 咨询记录管理：会话分页、消息数展示、情绪标签展示、会话详情弹窗、消息内容规范化。
- 情绪日记管理：日记分页、用户筛选、评分范围筛选、详情弹窗、删除。
- 数据概览：已有数据统计页面入口和接口预留。
- 请求封装：`src/utils/request.js` 已统一处理 `/api` 前缀、token 请求头、响应 code 判断和错误提示。

当前主要缺口：

- 缺少本地可控后端服务。
- 缺少数据库表结构和持久化数据。
- 注册页仍是前端模拟逻辑。
- AI 分析字段已有展示入口，但缺少真实后端计算与落库。
- 远程接口可用性不受本项目控制，不利于简历项目演示和后续扩展。

## 3. 总体优化目标

优化后项目应达到以下标准：

- 前端无需大规模重构即可切换到本地 FastAPI 后端。
- 后端能够提供登录、文章管理、咨询记录、情绪日记、数据概览等核心接口。
- MySQL 能保存用户、文章、会话、消息、日记和 AI 分析结果。
- AI 分析由后端统一调用模型 API，前端不直接接触模型密钥。
- AI 分析结果先落库再展示，避免详情页重复调用模型。
- 所有核心接口返回结构兼容当前前端请求封装。
- 项目可作为全栈简历项目展示，突出前端工程、后端接口、数据库设计和 AI 落地能力。

## 4. 后端目录规划

建议新增 `backend/` 目录，保持清晰分层：

```text
backend/
  app/
    main.py
    api/
      auth.py
      knowledge.py
      chat.py
      emotion_diary.py
      analytics.py
      upload.py
    schemas/
      auth.py
      knowledge.py
      chat.py
      emotion_diary.py
      analytics.py
      common.py
    models/
      user.py
      knowledge.py
      chat.py
      emotion_diary.py
      ai_analysis.py
    repositories/
      user_repo.py
      knowledge_repo.py
      chat_repo.py
      emotion_diary_repo.py
      ai_analysis_repo.py
    services/
      auth_service.py
      knowledge_service.py
      chat_service.py
      emotion_diary_service.py
      analytics_service.py
    ai/
      client.py
      prompts.py
      parsers.py
      analysis_service.py
    core/
      config.py
      security.py
      response.py
      exceptions.py
    db/
      session.py
      init_db.py
  requirements.txt
  .env.example
  README.md
```

分层职责：

- `api`：接收请求、解析参数、调用 service、返回统一响应。
- `schemas`：定义 Pydantic 请求体和响应体。
- `models`：定义 SQLAlchemy/SQLModel 数据库模型。
- `repositories`：封装数据库查询与写入。
- `services`：编排业务流程，不直接处理 HTTP 细节。
- `ai`：封装模型调用、提示词、JSON 解析、失败兜底。
- `core`：统一配置、JWT、异常、响应结构。
- `db`：数据库连接、初始化和迁移入口。

## 5. 接口兼容计划

后端应优先实现当前前端已调用的接口，不要求前端改路径。

统一响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

核心接口：

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 登录 | POST | `/user/login` | 返回 token |
| 知识分类 | GET | `/knowledge/category/tree` | 返回分类列表 |
| 文章分页 | GET | `/knowledge/article/page` | 支持标题、分类、状态筛选 |
| 新增文章 | POST | `/knowledge/article` | 新增知识文章 |
| 更新文章 | PUT | `/knowledge/article` | 更新知识文章 |
| 文章详情 | GET | `/knowledge/article/{id}` | 获取文章详情 |
| 删除文章 | DELETE | `/knowledge/article/{id}` | 删除文章 |
| 文章状态 | PUT | `/knowledge/article/{id}/status` | 发布或下线 |
| 文件上传 | POST | `/file/upload` | 返回文件访问 URL |
| 会话分页 | GET | `/psychological-chat/sessions` | 查询咨询会话 |
| 会话详情 | GET | `/psychological-chat/sessions/{sessionId}` | 查询会话基础信息 |
| 会话消息 | GET | `/psychological-chat/sessions/{sessionId}/messages` | 查询消息列表 |
| 会话情绪 | GET | `/psychological-chat/session/{sessionId}/emotion` | 查询会话 AI 分析 |
| 日记分页 | GET | `/emotion-diary/admin/page` | 查询情绪日记 |
| 删除日记 | DELETE | `/emotion-diary/admin/{id}` | 删除日记 |
| 数据概览 | GET | `/data-analytics/overview` | 返回统计和分析概览 |

注册功能可补充接口：

- `POST /user/register`

前端当前注册页是模拟逻辑，后续可在不影响主流程的前提下接入真实注册接口。

## 6. 数据库设计

### 6.1 users

用户与后台管理员账号。

核心字段：

- `id`：主键
- `username`：用户名，唯一
- `email`：邮箱，唯一
- `password_hash`：密码哈希
- `role`：角色，默认 `admin`
- `status`：账号状态
- `created_at`：创建时间
- `updated_at`：更新时间

### 6.2 knowledge_categories

知识文章分类。

核心字段：

- `id`：主键
- `category_name`：分类名称
- `parent_id`：父分类 ID，可为空
- `sort_order`：排序
- `status`：状态
- `created_at`
- `updated_at`

### 6.3 knowledge_articles

知识文章内容。

核心字段：

- `id`：主键
- `title`：文章标题
- `category_id`：分类 ID
- `author_id`：作者用户 ID
- `summary`：摘要
- `tags`：标签，逗号分隔或 JSON 字符串
- `cover_image`：封面图 URL
- `content`：富文本内容
- `read_count`：阅读数
- `status`：状态，建议 `0` 草稿、`1` 已发布、`2` 已下线
- `published_at`：发布时间
- `created_at`
- `updated_at`

### 6.4 chat_sessions

AI 心理咨询会话。

核心字段：

- `id`：主键
- `session_id`：对外展示的会话 ID，唯一
- `user_id`：用户 ID
- `user_name`：用户名称快照
- `start_time`：开始时间
- `end_time`：结束时间
- `message_count`：消息数
- `emotion_tags`：情绪标签
- `ai_summary`：会话摘要
- `risk_level`：风险等级
- `status`：状态
- `created_at`
- `updated_at`

### 6.5 chat_messages

会话消息明细。

核心字段：

- `id`：主键
- `session_id`：关联 `chat_sessions.session_id`
- `role`：消息角色，`user` 或 `assistant`
- `content`：消息内容
- `message_time`：消息时间
- `raw_payload`：原始消息 JSON，可为空
- `created_at`

### 6.6 emotion_diaries

情绪日记。

核心字段：

- `id`：主键
- `user_id`：用户 ID
- `user_name`：用户名称快照
- `nickname`：昵称
- `session_id`：关联会话 ID，可为空
- `diary_date`：日记日期
- `mood_score`：心情评分，1-10
- `sleep_quality`：睡眠质量，1-5
- `stress_level`：压力等级，1-5
- `dominant_emotion`：用户记录的主情绪
- `emotion_triggers`：情绪触发因素
- `diary_content`：日记内容
- `created_at`
- `updated_at`

### 6.7 ai_analysis_results

AI 分析结果统一表。

核心字段：

- `id`：主键
- `biz_type`：业务类型，`emotion_diary` 或 `chat_session`
- `biz_id`：业务 ID
- `main_emotion`：主情绪
- `emotion_intensity`：情绪强度，0-100
- `emotion_nature`：情绪性质，例如积极、消极、中性
- `risk_level`：风险等级，例如 low、medium、high
- `risk_description`：风险描述
- `professional_advice`：专业建议
- `improvement_suggestions`：改善建议
- `summary`：会话摘要或分析摘要
- `emotion_tags`：情绪标签
- `model_name`：调用模型名称
- `raw_response`：模型原始响应
- `status`：状态，`success`、`failed`、`pending`
- `error_message`：失败原因
- `created_at`
- `updated_at`

## 7. AI 分析流程

### 7.1 情绪日记分析

输入：

- 日记内容
- 心情评分
- 睡眠质量
- 压力等级
- 情绪触发因素
- 用户填写的主情绪

输出：

- 主情绪
- 情绪强度
- 情绪性质
- 风险等级
- 风险描述
- 专业建议
- 改善建议

执行策略：

- 后端接收到日记创建或后台触发分析请求后，调用 AI 分析服务。
- AI 返回 JSON 后进行字段校验和兜底解析。
- 成功结果写入 `ai_analysis_results`。
- 页面详情优先读取已落库结果。
- 模型失败时不影响日记列表和详情查询，分析状态标记为 `failed` 或 `pending`。

### 7.2 咨询会话摘要

输入：

- 会话基础信息
- 用户消息列表
- AI 回复列表
- 消息时间顺序

输出：

- 会话摘要
- 情绪标签
- 风险提示
- 建议关注点
- 风险等级

执行策略：

- 后端按会话 ID 查询消息列表。
- 将消息压缩为结构化文本传给模型。
- 模型返回摘要、标签和风险等级。
- 分析结果写入 `ai_analysis_results`。
- 可将 `summary`、`emotion_tags`、`risk_level` 回写到 `chat_sessions`，方便列表页快速展示。
- 列表页不应逐行实时调用模型，避免加载慢和成本失控。

## 8. 前后端联调策略

本地开发建议：

- FastAPI 运行在 `http://127.0.0.1:8000`
- Vite 运行在 `http://127.0.0.1:5173`
- 前端继续使用 `/api` 前缀
- `vite.config.js` 的代理目标按环境切换

联调顺序：

1. 先实现 `/user/login`，保证后台可进入。
2. 实现文章分类和文章分页，让知识管理页可加载。
3. 实现文章新增、编辑、删除、状态切换。
4. 实现咨询会话分页和消息详情。
5. 实现情绪日记分页、详情数据和删除。
6. 实现数据概览接口。
7. 接入 AI 分析结果读取。
8. 最后补充 AI 触发分析接口和异步任务优化。

## 9. 阶段性交付计划

### 第一阶段：后端基础闭环

交付内容：

- FastAPI 项目骨架
- MySQL 连接配置
- 统一响应结构
- JWT 登录
- 用户表和管理员种子账号

验收标准：

- `POST /user/login` 返回 token。
- 前端登录后能进入 `/back/dashboard`。
- 无 token 访问后台仍会被前端路由守卫拦截。

### 第二阶段：知识文章模块

交付内容：

- 分类表
- 文章表
- 文章分页、详情、新增、编辑、删除、上下线
- 文件上传接口

验收标准：

- 知识文章页能正常加载分页。
- 新增文章后列表可见。
- 编辑文章能回显并保存。
- 上下线状态能更新。
- 删除后列表刷新正确。

### 第三阶段：咨询记录模块

交付内容：

- 会话表
- 消息表
- 会话分页
- 会话详情
- 消息列表

验收标准：

- 咨询记录页能展示会话 ID、消息数、时间、预览文本。
- 点击详情能打开消息弹窗。
- 消息角色、时间和内容展示正确。
- 单条消息异常不影响整个列表展示。

### 第四阶段：情绪日记模块

交付内容：

- 情绪日记表
- 日记分页
- 用户和评分筛选
- 日记删除
- 日记详情字段返回

验收标准：

- 情绪日记页能分页展示。
- 用户 ID 和评分范围筛选有效。
- 详情弹窗字段完整。
- 删除后分页状态正确。

### 第五阶段：AI 分析模块

交付内容：

- AI 分析结果表
- 情绪日记分析服务
- 咨询会话摘要服务
- 分析失败兜底
- 分析结果查询接口

验收标准：

- 情绪日记详情能展示 AI 主情绪、强度、风险等级和建议。
- 咨询记录列表能展示情绪标签和摘要。
- 模型调用失败时业务列表和详情仍可正常打开。
- 前端不保存也不暴露任何模型 API Key。

### 第六阶段：数据概览与演示优化

交付内容：

- 数据概览统计接口
- 会话数、文章数、日记数、风险等级分布等统计
- README 和演示说明
- 示例数据初始化脚本

验收标准：

- Dashboard 能展示真实统计数据。
- 一条命令可初始化演示数据。
- 项目说明能支持简历展示和本地运行。

## 10. 验证清单

后端验证：

- `python -m py_compile` 检查核心 Python 文件。
- FastAPI 应用可以正常 import。
- Swagger 页面可以打开。
- 登录接口返回 token。
- 所有核心接口返回 `{ code, message, data }`。

前端验证：

- `npm run build` 构建通过。
- 登录流程可用。
- 知识文章列表、弹窗、状态切换可用。
- 咨询记录列表和详情可用。
- 情绪日记列表和详情可用。
- AI 分析字段为空时页面不报错。

数据库验证：

- 初始化脚本可创建表。
- 种子数据可插入。
- 外键关系或业务关联字段可查询。
- 删除操作不会造成前端分页异常。

AI 验证：

- 使用测试模型或 mock 响应验证 JSON 解析。
- 模型超时、返回非 JSON、字段缺失时都有兜底。
- 分析结果成功落库。
- 重复打开详情不会重复触发模型调用。

## 11. 风险与控制

接口风险：

- 风险：后端字段名与前端期望不一致。
- 控制：先按 `src/api/admin.js` 和页面字段反推响应结构，再实现后端。

AI 成本风险：

- 风险：列表页批量调用模型导致慢和成本高。
- 控制：AI 分析异步或手动触发，结果落库，列表只查数据库。

数据设计风险：

- 风险：为某个页面临时加字段，后续重复和难维护。
- 控制：统一用 `ai_analysis_results` 保存 AI 结果，用业务表保存高频展示字段。

安全风险：

- 风险：API Key 或数据库密码泄露。
- 控制：只使用 `.env`，提交 `.env.example`，不提交真实密钥。

演示风险：

- 风险：真实模型或远程服务不可用导致演示失败。
- 控制：准备 mock AI 响应和初始化数据脚本。

## 12. 简历表达方向

完成上述优化后，项目可以包装为：

> AI 心理健康管理平台：基于 Vue3 + FastAPI + MySQL 构建心理咨询后台，覆盖知识文章管理、AI 咨询会话追踪、情绪日记管理和数据分析。设计并实现 JWT 鉴权、RESTful 接口、数据库模型和 AI 情绪分析服务，支持会话摘要、情绪标签、风险等级识别和分析结果落库，形成从前端管理、后端服务到 AI 能力落地的完整闭环。

突出能力：

- Vue3 后台管理系统开发
- FastAPI 后端接口设计
- MySQL 数据建模
- JWT 鉴权和统一响应封装
- AI API 后端安全接入
- 情绪分析和会话摘要业务落地
- 前后端联调与工程化验收
