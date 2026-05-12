# 后续待办推进提示词

> 本文件包含每个待办任务的推进提示词，可复制到新 Claude Code 窗口中执行。
> 每条提示词包含：**边界**（不乱动的范围）、**目标**（要做什么）、**验收标准**（怎么算做完）。

---

## #14+ 后端 E2E 测试扩展

### 边界
- 只修改 `server/test/app.e2e-spec.ts`，不动任何源代码、Prisma schema、migration
- 不新增测试配置文件，不修改 CI pipeline
- 不涉及 Playwright 前端 E2E

### 目标
将后端 E2E 测试从当前 7 条（health/login/chat）扩展到覆盖 knowledge / emotion-diary / analytics / upload / client-article 模块。

### 验收标准
1. knowledge 模块覆盖：分类树、文章分页、文章详情、文章创建/更新/删除、文章状态审核
2. emotion-diary 模块覆盖：admin 分页、admin 删除
3. analytics 模块覆盖：overview、trends（三种类型）
4. upload 模块覆盖：文件上传（模拟文件）
5. client-article 模块覆盖：公开分类树、公开文章分页、公开文章详情（新增的 #29 接口）
6. 总用例数 ≥ 25 条
7. 运行 `cd server && npm run test:e2e` 全部通过
8. 不破坏已有 7 条测试

### 提示词（可复制）

```
在后端 E2E 测试文件 server/test/app.e2e-spec.ts 中扩展测试覆盖。

当前已有 7 条测试（health/login/chat/chat-messages）。
请追加以下模块的测试用例（每个模块用独立的 describe 块）：

1. knowledge — 分类树、文章分页、文章详情、文章 CRUD、状态审核（需要先通过 login 获取 token）
2. emotion-diary — admin 分页、admin 删除
3. analytics — overview、trends?type=emotion/session/article
4. upload — 模拟文件上传（使用 supertest 的 attach）
5. client-article — 公开分类树、公开文章分页、公开文章详情（无需 token）
6. 新增文章公开查询接口的测试（GET /api/client/article/categories, /published, /published/:id）

约束：
- 不修改任何源代码
- 使用已有的 admin 登录流程获取 token
- 所有 describe 块放在 app e2e 测试套件内
- 运行 cd server && npm run test:e2e 全部通过
- 总用例数 >= 25 条
```

---

## #13+ 跨平台启动脚本 setup.sh

### 边界
- 只新建 `scripts/setup.sh`，不动已有的 `scripts/start-dev.ps1`、`docker-compose.yml`、Dockerfile
- 不修改任何源代码、配置文件
- 不需要覆盖 Windows（PowerShell 已有）

### 目标
macOS/Linux 用户能通过 `bash scripts/setup.sh` 一键完成环境检测 → 依赖安装 → 数据库初始化 → 启动开发服务器。

### 验收标准
1. 检测 node/npm 是否安装，未安装时给出明确指引
2. 自动执行根目录 `npm install`
3. 自动执行 `cd server && npm install`
4. 自动执行 `cd server && npx prisma migrate dev`
5. 自动执行 `cd server && npx prisma db seed`
6. 同时启动前端（`npm run dev`）和后端（`cd server && npm run start:dev`）开发服务器
7. 输出清晰的启动日志和访问地址
8. 脚本有 `set -e` 安全保护，失败时停止

### 提示词（可复制）

```
在 scripts/setup.sh 新建跨平台启动脚本（bash），用于 macOS/Linux 一键启动开发环境。

要求：
1. 首先检测 node / npm 是否已安装
2. 执行 cd .. && npm install（安装前端依赖）
3. 执行 cd server && npm install（安装后端依赖）
4. 执行 cd server && npx prisma migrate dev（数据库迁移）
5. 执行 cd server && npx prisma db seed（种子数据）
6. 并行启动前端（npm run dev）和后端（cd server && npm run start:dev）
7. 输出清晰的日志前缀 [frontend] / [backend]
8. 启动后打印访问地址：前端 http://localhost:5173，后端 http://localhost:8000
9. 脚本顶部 set -e，出错即停

约束：
- 只创建 scripts/setup.sh，不动其他文件
- 不涉及 Docker
- 参考 scripts/start-dev.ps1 的逻辑，但用 bash 语法重写
```

---

## #18 DeepSeek API 接入文档

### 边界
- 只新建 `docs/deepseek-integration.md`，不涉及任何代码修改
- 不暴露任何真实 API Key

### 目标
为开发者提供完整的 DeepSeek API 接入说明，包括配置方式、模型选择、mock 模式、故障排查。

### 验收标准
1. 包含 API Key 获取和配置说明（后端 `.env` 方式）
2. 包含模型选择建议（deepseek-chat / deepseek-v4-flash 等）
3. 包含流式调用和非流式调用的链路说明
4. 包含 Mock 模式说明（未配置 Key 时如何降级）
5. 包含常见故障排查清单（401、超时、限流等）
6. 包含 AI 分析结果落库流程说明
7. 文档格式清晰，中文章节标题

### 提示词（可复制）

```
在 docs/deepseek-integration.md 编写 DeepSeek API 接入文档。

内容要求：
1. 环境配置 — 如何获取和配置 DeepSeek API Key
2. 模型选择 — deepseek-chat / deepseek-v4-flash 的区别和建议
3. 调用方式 — 流式（chat/send 接口）和非流式说明，前端→后端→DeepSeek 的完整链路
4. Mock 模式 — 未配置 API Key 时如何自动降级返回模拟结果
5. AI 分析流程 — 情绪日记分析和咨询会话摘要的输入→输出→落库流程
6. 故障排查 — 常见错误（401 认证失败、超时、限流 hit RateLimitError、无效模型名）的排查步骤
7. 不暴露任何真实 API Key

参考代码位置：
- server/src/ai/ 下的 ai.service.ts 和 ai.module.ts
- server/src/analysis/ 下的 analysis.service.ts
- server/.env 中的 DEEPSEEK_* 配置项
```

---

## #23 管理端剩余图表

### 边界
- 不动已有的 Dashboard.vue 和 ECharts 配置
- 不新增第三方图表库，只使用已有的 ECharts
- 不修改后端 analytics 接口返回结构

### 目标
在管理端新增数据可视化页面/组件，展示用户活跃度、文章阅读排行等指标。

### 验收标准
1. 新增页面或组件可正常渲染 ECharts 图表
2. 图表数据来自现有的 `/api/data-analytics/*` 接口
3. 至少包含 2 种新图表视图
4. 与现有 Dashboard 风格一致

### 提示词（可复制）

```
在管理端新增数据可视化图表。当前 Dashboard.vue 已有情绪趋势/咨询量/文章发布三种图表。

约束：
- 不修改 Dashboard.vue 已有代码
- 不新增第三方图表库（ECharts 已引入）
- 不修改后端 analytics 接口

可选择的方向：
1. 在 Dashboard 新增卡片行：用户活跃度（日/周活跃用户数柱状图）
2. 新增独立页面：文章阅读排行（基于 knowledge_articles.readCount 排序展示）
3. 使用 admin.ts 中的已有 analytics 接口获取数据

实现要求：
- 图表数据为空时有友好的空状态提示
- 保持现有 ECharts 主题和配色风格
- 页面路由放到 /back/dashboard 扩展或新建 /back/analytics
```

---

## #27 新手引导

### 边界
- 不改变登录/注册流程
- 不修改路由守卫逻辑
- 不引入第三方引导库

### 目标
用户在首次使用各功能模块时能看到空状态引导和操作提示。

### 验收标准
1. 管理端各页面在无数据时显示引导文案和操作按钮
2. 用户端（ClientChat / ClientDiary / ClientArticles）在无数据时显示引导文案
3. 引导文案简洁有用，指向明确的下一个操作

### 提示词（可复制）

```
为用户端和管理端的空状态页面添加新手引导。

需要修改的文件：
- src/views/ClientChat.vue — 无会话历史时显示"开始第一次 AI 咨询"引导
- src/views/ClientDiary.vue — 无日记时显示"写下第一篇情绪日记"引导
- src/views/ClientArticles.vue — 无投稿时引导"写第一篇文章"
- src/views/Dashboard.vue — 数据为空时显示引导文案

实现要求：
- 使用 Element Plus 的 el-empty 组件（已有使用）
- 引导文案包含下一步操作按钮
- 不改动页面已有数据加载后的布局
```

---

## #24 移动端适配

### 边界
- 不做系统化响应式重构，只补充关键页面的 media query
- 不引入新的 CSS 框架
- 不改动后端

### 目标
关键的前端页面在 375px 宽度移动设备上可浏览和基本操作。

### 验收标准
1. 管理端布局（BackendLayout）在窄屏下侧栏可收起
2. 用户端布局（ClientLayout）在窄屏下导航可适配
3. 表格页面出现水平滚动提示或响应式降级
4. 表单页面在窄屏下输入框可操作
5. 不破坏现有桌面端布局

### 提示词（可复制）

```
为关键前端页面补充移动端（375px 宽度）适配样式。

约束：
- 不使用新的 CSS 框架或库
- 只使用 media query 补充样式覆盖
- 不重构现有布局结构

需要适配的页面和文件：
1. src/components/BackendLayout.vue — 侧栏在窄屏时自动折叠为图标模式
2. src/views/ClientLayout.vue — 顶部导航在窄屏时使用 el-menu 折叠模式
3. 所有表格页面 — 添加水平滚动支持（overflow-x: auto）
4. 弹窗/对话框 — 窄屏时宽度调整为 90vw

实现要求：
- 断点使用 max-width: 768px
- 保持功能完整，不隐藏关键操作按钮
```

---

## #25 WebSocket 实时通知

### 边界
- 不引入第三方推送服务
- 后端使用 NestJS WebSocket Gateway（@nestjs/websockets）
- 前端保留现有轮询作为兜底

### 目标
将通知模块从定时轮询改为 WebSocket 实时推送。

### 验收标准
1. 后端新增 WebSocket Gateway，在通知创建时推送事件
2. 前端建立 WebSocket 连接，接收通知后更新未读数
3. 连接断开时自动重连
4. 页面不可见时暂停重连以减少资源占用
5. 现有轮询机制作为降级兜底

### 提示词（可复制）

```
为通知模块引入 WebSocket 实时推送。

后端：
1. 在 server/src/notification/ 下新增 notification.gateway.ts
2. 使用 @WebSocketGateway 建立 WebSocket 服务
3. 用户连接时根据 JWT token 进行身份认证
4. NotificationService.create 方法中在创建通知后向对应用户推送事件
5. 端口复用在现有 HTTP 服务上（无需新端口）

前端：
1. 在 src/utils/ 下新增 websocket.ts 工具
2. 建立 WebSocket 连接，连接地址从环境变量获取
3. 收到通知事件时更新 store 中的未读数
4. 自动重连机制（2s/4s/8s 指数退避，最大 30s）
5. 页面不可见时断开连接，可见时重连
6. 保留现有轮询作为降级（WebSocket 失败时自动切回轮询）

约束：
- 不修改通知的数据库结构和 API 接口
- 不引入第三方 WebSocket 库（使用原生 WebSocket API）
- 后端不新增端口
```

---

## #26 i18n 国际化

### 边界
- 只支持中英文切换，不涉及其他语言
- 核心页面覆盖，不做 100% 全覆盖
- 不改变项目已有的语言选择逻辑

### 目标
引入 vue-i18n，实现核心管理端和用户端页面的中英文切换。

### 验收标准
1. 安装 vue-i18n 并配置
2. 创建中文和英文语言包（覆盖核心页面）
3. 语言切换组件放在用户头像下拉菜单中
4. 切换后刷新页面保持语言选择
5. 英文作为 fallback 语言

### 提示词（可复制）

```
为前端引入 vue-i18n 实现中英文国际化。

步骤：
1. npm install vue-i18n
2. 创建 src/lang/zh-CN.js 和 src/lang/en-US.js 语言包
3. 在 src/main.js 中初始化 vue-i18n 实例并注册到 app
4. 创建 src/lang/index.js 统一导出
5. 语言切换按钮放在 ClientLayout 和 BackendLayout 的用户下拉菜单中
6. 使用 localStorage 保存用户语言偏好

覆盖范围（至少）：
- 登录/注册页面的所有文本
- 管理端侧栏菜单名称
- 用户端顶栏导航名称
- 通知相关文案
- 所有页面的标题

约束：
- 不一次性将所有 .vue 文件的硬编码中文替换为 $t
- 核心页面覆盖即可，后续可增量补充
- 英语包可以暂用英文占位（非完美翻译也可接受）
```
