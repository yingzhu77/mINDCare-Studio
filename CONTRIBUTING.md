# 贡献指南

感谢你考虑为本项目贡献代码！以下指南帮助你快速度过磨合期。

## 行为准则

请保持专业、友善的沟通态度。所有参与者都应享有受尊重的协作体验。

## 如何贡献

### 报告 Bug

1. 先搜索 [Issues](https://github.com/yingzhu77/ai-vue/issues) 确认是否已有相同报告。
2. 新建 Issue 时请附上：
   - 环境信息（Node 版本、浏览器版本）
   - 复现步骤（越详细越好）
   - 期望行为与实际行为对比
   - 截图或错误日志（可选）

### 提交新功能

1. 先开 Issue 讨论你的想法，避免重复造轮子。
2. 维护者会在 Issue 中确认是否接受该功能。

### Pull Request 流程

1. **Fork** 本仓库并创建你的分支：`git checkout -b feat/my-feature`
2. **本地开发**：
   ```bash
   # 启动后端
   cd server && npm install && npx prisma db push && npx prisma db seed

   # 启动前端
   npm install && npm run dev
   ```
3. **提交前检查**：
   - 前端构建通过：`npm run build`
   - 后端构建通过：`cd server && npm run build`
   - 测试通过：`cd server && npm test`
   - 代码风格遵循 ESLint 配置

### 关于 AI API Key

- 本项目默认使用 **Mock AI 模式**，无需 API Key 即可开发
- 如需测试真实 AI 功能，在 `server/.env` 中配置 `DEEPSEEK_API_KEY`
- **绝不提交真实 Key** 到仓库中（`.env` 已在 `.gitignore` 中）
4. **Commit 格式**：遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)
   - `feat:` 新功能
   - `fix:` 修复 Bug
   - `docs:` 文档变更
   - `refactor:` 重构
   - `test:` 测试相关
   - `chore:` 构建/工具链变更
5. **发起 PR**：描述变更内容、动机和影响范围。

## 本地启动

详见 [README.md](./README.md) 中的"快速开始"部分。

## 项目结构

```
ai-vue/
├── src/                  # Vue3 前端
│   ├── views/            # 页面组件
│   ├── api/              # 接口封装
│   ├── router/           # 路由配置
│   ├── store/            # Pinia 状态管理
│   └── components/       # 复用组件
├── server/               # NestJS 后端
│   ├── src/              # 源码
│   │   ├── auth/         # 认证模块
│   │   ├── knowledge/    # 知识文章模块
│   │   ├── chat/         # 咨询会话模块
│   │   ├── emotion-diary/# 情绪日记模块
│   │   ├── analysis/     # AI 分析模块
│   │   └── common/       # 通用工具
│   └── prisma/           # 数据库 Schema 和 Migration
├── scripts/              # 启动脚本
└── docs/                 # 文档
```

## 代码风格

- 前端：Vue3 `<script setup>` + Composition API
- 后端：NestJS 模块化结构 + Prisma ORM
- 函数名和变量名使用英文驼峰，注释使用中文
- 不做超前设计：只实现当前所需的最少代码
