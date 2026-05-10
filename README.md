# AI 心理健康管理平台

[![Vue 3](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-EA2845?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI 驱动的心理健康管理平台。Vue 3 管理后台 + NestJS 后端 + Prisma ORM + DeepSeek AI 能力。

> 📌 这是一个全栈 Web SaaS 练习项目，具备清晰的前后端边界、统一的类型契约和完整的业务闭环。

---

## 功能概览

### 管理端

| 模块 | 功能 |
|------|------|
| 📊 数据概览 | Dashboard 统计面板，展示用户活跃度、咨询量、情绪趋势 |
| 📝 知识文章 | 文章 CRUD、分类管理、审核队列（通过/驳回/原因填写） |
| 💬 咨询记录 | 会话列表、消息详情、AI 摘要展示 |
| 📖 情绪日记 | 日记列表查看、删除、AI 情绪分析结果展示 |
| 🧠 AI 分析 | 情绪分析和会话摘要的触发与结果查看 |

### 用户端

| 模块 | 功能 |
|------|------|
| 🤖 AI 聊天 | SSE 流式对话，消息自动落库 |
| 📖 情绪日记 | 日记 CRUD、心情评分、睡眠质量记录 |
| 📚 文章投稿 | 查看文章、创建/编辑草稿、提交审核、根据审核反馈修改 |
| 👤 个人中心 | 个人资料管理 |

### 技术特点

- **JWT 认证**，基于角色的路由守卫（admin / user）
- **统一响应格式**：全局 TransformInterceptor + 异常过滤器
- **AI Mock 模式**：未配置 API Key 时自动使用模拟数据
- **缓存分析结果**：已分析的数据不再重复调用模型
- **文章状态机**：`draft → pending_review → published / rejected → re-submit`

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 1. 克隆并安装

```bash
git clone <your-repo-url>
cd ai-vue

# 安装前端依赖
cd "ai-vue project" && npm install && cd ..

# 安装后端依赖
cd server && npm install && cd ..
```

### 2. 数据库初始化

```bash
cd server

# 生成 Prisma Client
npx prisma generate

# 执行迁移（SQLite 自动创建）
npx prisma db push

# 填充示例数据
npx prisma db seed

cd ..
```

### 3. 启动开发服务

**方式一：一键启动（推荐）**

```powershell
.\scripts\start-dev.ps1
```

**方式二：分别启动**

```bash
# 终端 1 — 前端
cd "ai-vue project" && npm run dev

# 终端 2 — 后端
cd server && npm run start:dev
```

### 4. 访问

| 服务 | 地址 |
|------|------|
| 管理后台 | http://localhost:5173 |
| 后端 API | http://localhost:8000/api |
| Swagger 文档 | http://localhost:8000/api/docs |

### 预置账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123456` |
| 测试用户 | `testuser` | `test123456` |

---

## 技术栈

### 前端

- **Vue 3** + Composition API + `<script setup>`
- **Vite 5** 构建工具
- **Element Plus** UI 组件库
- **Pinia** 状态管理
- **Vue Router** 路由 + 鉴权守卫

### 后端

- **NestJS 10** 框架
- **Prisma 5** ORM + Migration
- **SQLite** 数据库（无需额外安装）
- **JWT** 认证（@nestjs/jwt）
- **DeepSeek API** AI 聊天 / 分析（Mock 模式可用）
- **Swagger** OpenAPI 文档

---

## 项目结构

```
ai-vue/
├── src/                       # Vue3 前端
│   ├── views/                 # 页面组件
│   │   ├── back/              # 管理端页面
│   │   └── client/            # 用户端页面
│   ├── api/                   # Axios 接口封装
│   ├── router/                # 路由 + 鉴权
│   ├── store/                 # Pinia 状态
│   ├── components/            # 复用组件
│   └── utils/                 # 工具函数
├── server/                    # NestJS 后端
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── knowledge/         # 知识文章模块
│   │   ├── chat/              # 咨询会话模块
│   │   ├── emotion-diary/     # 情绪日记模块
│   │   ├── analysis/          # AI 分析模块
│   │   ├── analytics/         # 数据统计模块
│   │   ├── ai/                # DeepSeek 客户端
│   │   ├── common/            # 过滤器/拦截器/守卫
│   │   └── config/            # 环境配置
│   ├── prisma/                # Schema + Migration
│   ├── test/                  # E2E 测试
│   └── uploads/               # 上传文件
├── scripts/                   # 启动脚本
├── docs/                      # 文档
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## 开发命令

```bash
# 前端构建检查
cd "ai-vue project" && npm run build

# 后端构建检查
cd server && npm run build

# 服务端测试
cd server && npm test

# 数据库迁移
cd server && npx prisma migrate dev

# Prisma Studio（数据库 GUI）
cd server && npx prisma studio
```

---

## License

MIT License — 详见 [LICENSE](LICENSE)
