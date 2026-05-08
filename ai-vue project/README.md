# AI 心理健康管理平台

面向长期 Web SaaS 开源方向推进的 AI 心理健康管理平台。项目目标不是只做一个本地后台演示，而是建设一个可 clone、可启动、可贡献、可扩展的全栈开源项目。

## 项目状态

**当前阶段：用户端基础模块已启动 (v0.4.0)**

| 层级 | 状态 | 说明 |
|------|------|------|
| 前端 | ✅ 管理端完成 | 登录/知识文章/咨询记录/情绪日志/Dashboard 全部接入真实接口 |
| 前端 | ✅ 用户端基础 | ClientLayout + AI 聊天(SSE) + 情绪日记页面已就绪 |
| 后端 | ✅ 主线完成 | NestJS + Prisma + 7 实体 + 认证 + 管理端接口 + AI 模块 |
| 数据库 | ✅ 主线完成 | Prisma migration 管理，SQLite 开发，可切换 MySQL |
| AI | ✅ 骨架就绪 | DeepSeek 客户端 + mock AI 模式 + SSE 流式 + 分析结果落库 |
| 开源 | 🔄 进行中 | 计划书已就绪，工程文件随阶段补齐 |

## 目标技术栈

**前端：**

- Vue3
- Vite
- Element Plus
- Axios + Pinia + Vue Router
- wangEditor

**后端主线（server/）：**

- TypeScript
- NestJS
- Prisma
- MySQL（开发期可用 SQLite）
- JWT
- Swagger / OpenAPI

**AI 接入：**

- DeepSeek API（兼容 OpenAI 接口格式）
- 后端代理调用 + SSE 流式响应
- 分析结果落库 + mock AI 演示模式

## 目录结构

```text
ai-vue project/
  src/                       # Vue3 前端
    api/
      admin.js               # 管理端 API 封装（已定义 16 个接口）
      client.js              # 用户端 API 封装（聊天、情绪日记）
    components/              # 复用组件（侧边栏、弹窗等）
    router/                  # 路由与鉴权守卫（角色区分 admin/user）
    store/                   # Pinia 状态管理（auth、menu）
    utils/                   # 工具函数（请求封装、消息解析）
    views/                   # 页面级组件
      ClientLayout.vue       # 用户端布局（顶部导航）
      ClientChat.vue         # AI 聊天（SSE 流式）
      ClientDiary.vue        # 用户端情绪日记

  server/                    # TypeScript 后端主线（NestJS + Prisma）
    prisma/
      schema.prisma          # 7 个核心实体
      seed.ts                # 管理员和默认分类
      migrations/
    src/
      main.ts
      app.module.ts
      common/                # 统一响应、异常过滤、Guard、装饰器
      auth/                  # 认证模块
      users/                 # 用户管理
      knowledge/             # 知识文章
      chat/                  # 咨询会话 + AI 聊天 SSE
      emotion-diary/         # 情绪日记
      analysis/              # AI 分析（情绪分析、会话摘要）
      analytics/             # Dashboard 数据概览
      upload/                # 文件上传
      ai/                    # DeepSeek 客户端 + mock 模式
    package.json
    tsconfig.json
    .env.example

  backend/                   # 旧 FastAPI 后端（legacy，不再扩展）
  docs/                      # 项目文档和计划书
  scripts/                   # 一键启动和演示数据脚本
  vite.config.js
  package.json
```

## 本地运行

### 前端

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

访问：`http://127.0.0.1:5173`

- 管理端：`/auth/login`（admin 角色登录后自动跳转 `/back/dashboard`）
- 用户端：`/auth/login`（user 角色登录后自动跳转 `/client/chat`）

### 后端（NestJS 主线）

```powershell
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 旧后端（FastAPI legacy，已停止扩展）

```powershell
python -m pip install -r .\backend\requirements.txt
python -m backend.app.db.init_db
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

> Vite 代理已指向 NestJS 后端（`http://127.0.0.1:8000`），FastAPI 后端不再使用。

## 已实现接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/login` | 登录，返回 JWT token |
| POST | `/api/user/register` | 注册 |
| GET | `/api/user/me` | 当前用户信息 |

### 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/knowledge/category/tree` | 知识分类树 |
| GET/POST/PUT/DELETE | `/api/knowledge/article/**` | 文章 CRUD |
| PUT | `/api/knowledge/article/:id/status` | 文章上下线 |
| GET | `/api/psychological-chat/sessions` | 咨询会话列表 |
| GET | `/api/psychological-chat/sessions/:id/messages` | 会话消息 |
| GET | `/api/emotion-diary/admin/page` | 情绪日记管理端分页 |
| DELETE | `/api/emotion-diary/admin/:id` | 情绪日记删除 |
| GET | `/api/data-analytics/overview` | Dashboard 统计 |
| POST | `/api/file/upload` | 文件上传 |
| POST | `/api/analysis/emotion-diary/:id` | 触发情绪日记 AI 分析 |
| POST | `/api/analysis/chat-session/:id` | 触发会话 AI 分析 |

### 用户端

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/send` | AI 聊天 SSE 流式 |
| GET | `/api/emotion-diary/my/page` | 我的情绪日记分页 |
| POST | `/api/emotion-diary` | 新增情绪日记 |
| PUT | `/api/emotion-diary/:id` | 更新情绪日记 |

### 统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页返回：

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

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123456 |

## 主计划书

所有开发决策、阶段划分、验收标准均以主计划书为准：

- [docs/project-fullstack-plan.md](docs/project-fullstack-plan.md)

## 验证命令

前端构建：

```powershell
npm run build
```

后端验证：

```powershell
cd server
npm run build
npx prisma migrate status
```

登录接口验证：

```powershell
curl -X POST http://127.0.0.1:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123456\"}"
```
