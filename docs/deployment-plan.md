# 部署上线双线计划

> 当前版本 **v2.5.2**，全部后端 + 前端测试全绿（60 前端 + 113 后端），代码就绪，按此计划推进部署上线。

---

## 总体策略

**两条线并行推进，互不依赖：**

| 路线 | 目标 | 交付物 |
|------|------|--------|
| **路线 A · 开源项目线** | Clone 即跑、Docker 部署、可云部署 | Docker Compose 完善 + 部署文档 |
| **路线 B · 本地演示 EXE 线** | 双击运行，内置全栈 + SQLite + Mock AI | Windows x64 安装包/portable exe |

**核心原则：** EXE 版不是生产替代品，仅定位为本地演示。

---

## 路线 A · 开源项目部署线

### A1 — Docker Compose 缺陷修复

当前已知 3 个缺陷，必须在发布前修复：

#### A1.1 Backend Dockerfile 迁移文件缺失

**问题：** 后端 Dockerfile 只复制了 `prisma/mysql/schema.prisma`，没有复制 `prisma/mysql/migrations/` 目录，docker-entrypoint 执行 `prisma migrate deploy` 会失败。

**修复：** 在 backend Dockerfile 第二 stage 增加迁移文件复制：

```diff
# server/Dockerfile
  # Prisma 客户端 + 迁移文件
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
- COPY --from=builder /app/prisma ./prisma
+ COPY --from=builder /app/prisma/mysql ./prisma
+ # docker-entrypoint 运行时即有 prisma/schema.prisma + prisma/migrations/
```

同时修正 docker-entrypoint.sh schema 路径：

```sh
npx prisma migrate deploy --schema=prisma/schema.prisma
```

#### A1.2 uploads 目录持久化缺失

**问题：** docker-compose.yml 后端没有 uploads volume，文件上传在容器重建后丢失。

**修复：** 在 docker-compose.yml 添加 uploads volume：

```yaml
backend:
  volumes:
    - uploads_data:/app/uploads
# ...
volumes:
  mysql_data:
  uploads_data:
```

#### A1.3 生产端口暴露问题

**问题：** 后端 `8000` 端口直接暴露到宿主机，生产环境应仅内网访问。

**修复：** 在 docker-compose.yml 后端服务中移除 `ports`，或改为仅本地绑定：

```yaml
# 生产模式（nginx 前端代理后端，不暴露后端端口）
ports:
  - "127.0.0.1:8000:8000"  # 仅本机调试，不对外
```

### A2 — 统一配置管理

#### A2.1 DeepSeek 默认模型统一

当前 `server/.env.example` 使用 `deepseek-v4-flash`，`server/.env.production` 使用 `deepseek-chat`。应统一为 `deepseek-v4-flash`。

#### A2.2 .env.production 完善

补充缺失的环境变量：

```env
# 危机热线配置（用于 AI 系统提示词）
CRISIS_HOTLINE=400-161-9995
CRISIS_HOTLINE_NAME=全国心理援助热线
```

### A3 — README 三种运行方式

README.md 顶部应明确列出三种运行方式及其适用场景：

| 方式 | 命令 | 适用 |
|------|------|------|
| 开发运行 | `npm run dev` + `cd server && npm run start:dev` | 开发/调试 |
| Docker 部署 | `docker compose up -d` | 生产/自部署 |
| Windows EXE | 下载 `.exe` 安装包 | 本地演示 |

### A4 — Docker 安全加固

1. COMPOSE_BAKE 或 build secrets 管理敏感信息（不在 image layer 中留下密码）
2. 后端 Dockerfile 添加非 root 用户运行
3. MySQL Dockerfile 自定义 root password 而不使用 compose 默认值
4. health 检查完善: `curl -f http://localhost:8000/health`

---

## 路线 B · 本地演示 EXE 线

### B1 — 技术选型

| 项目 | 选择 | 原因 |
|------|------|------|
| 桌面壳 | **Electron 33+** | Node 生态原生，启动 NestJS 子进程自然 |
| 数据库 | **SQLite**（Prisma 内置管理） | 体积小，零配置，适合本地演示 |
| AI | **Mock AI 默认**，可选填 Key | 不内置 Key，合规安全 |
| 打包工具 | **electron-builder** | 成熟稳定，NSIS/portable 都支持 |
| 前端 | **Vue dist 静态文件** | Electron 直接加载 `dist/index.html` |

### B2 — 目录结构

```
desktop/
  main.js                  # Electron 主进程
  preload.js               # 预加载脚本（安全暴露 API）
  package.json             # Electron 项目依赖与脚本
  electron-builder.yml     # 打包配置
  assets/
    icon.ico               # 应用图标
  scripts/
    db-init.js             # 首次启动复制 demo.db 到用户目录
    backend.js             # 启动/停止 NestJS 子进程
```

### B3 — 运行流程

```
用户双击 ai-mental-health.exe
  │
  ├─ 1. Electron 主进程启动
  ├─ 2. 分配随机可用端口（如 57329）
  ├─ 3. 设置环境变量：
  │     DATABASE_URL=file:<用户数据目录>/ai-mental-health/demo.db
  │     APP_MODE=desktop
  │     PORT=<随机端口>
  │     DEEPSEEK_API_KEY=<用户配置或空>
  ├─ 4. 启动 NestJS 子进程（fork server/dist/main.js）
  ├─ 5. 等待 HTTP 服务就绪（轮询 /health）
  ├─ 6. 创建 BrowserWindow，加载 Vue dist/index.html
  │     ——注入 API base URL（localStorage 或全局变量）
  ├─ 7. 用户关闭窗口 → 清理子进程 → 退出
```

### B4 — 数据方案

#### B4.1 首次启动

```js
// desktop/scripts/db-init.js
const userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'ai-mental-health')

// 复制内置 demo.db 到用户目录
const builtinDb = path.join(__dirname, '..', 'data', 'demo.db')
const userDb = path.join(userDataDir, 'demo.db')

if (!fs.existsSync(userDb)) {
  // 包含预置 seed 数据：admin 用户 + 示例文章 + 示例日记
  fs.copyFileSync(builtinDb, userDb)
}
```

#### B4.2 重置功能

在应用菜单或设置页提供"重置演示数据"按钮：
- 删除 `%APPDATA%/ai-mental-health/demo.db`
- 重新从内置数据库复制
- 重启后端进程

#### B4.3 数据库内置 seed 数据

内置 `demo.db` 应包含：
- 管理员账号（admin / admin123456）
- 测试用户（testuser / test123456）
- 3-5 篇示例知识文章（已发布状态）
- 2-3 条示例情绪日记
- 1-2 条示例 AI 分析结果

### B5 — Mock AI + 可选 Key 方案

#### B5.1 默认 Mock AI

EXE 版启动时不配置 `DEEPSEEK_API_KEY`，后端自动降级 Mock AI 模式。聊天返回预设回复（逐字流式），分析返回模拟数据。

#### B5.2 用户填入 Key

在 Electron 渲染进程提供"设置"面板：

```vue
<!-- 设置弹窗 -->
<el-dialog title="AI 设置">
  <el-input v-model="apiKey" placeholder="填入你的 DeepSeek API Key" />
  <p class="hint">
    用于体验真实 AI 回复。Key 仅保存在你的电脑上，不会上传到任何地方。
    获取地址：https://platform.deepseek.com/api_keys
  </p>
</el-dialog>
```

**Key 存储：** 写入 `%APPDATA%/ai-mental-health/config.json`，不在 EXE 内硬编码。

**Key 生效：** 修改后提示用户重启应用（或自动重启后端进程）。

### B6 — 端口管理

使用随机可用端口避免冲突：

```js
// desktop/main.js
import net from 'net'

function getRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

const apiPort = await getRandomPort()
process.env.PORT = String(apiPort)
```

前端通过 preload 获取端口：

```js
// preload.js
contextBridge.exposeInMainWorld('appConfig', {
  apiBaseUrl: `http://127.0.0.1:${apiPort}/api`,
})
```

### B7 — 打包配置

#### B7.1 electron-builder 配置

```yaml
# desktop/electron-builder.yml
appId: com.ai-mental-health.desktop
productName: AI心理健康助手
directories:
  output: dist-electron
  buildResources: assets
files:
  - main.js
  - preload.js
  - scripts/**/*
  # 前端构建产物
  - "!../../dist/**"
extraResources:
  - from: ../server/dist
    to: server/dist
  - from: ../server/node_modules
    to: server/node_modules
  - from: data/demo.db
    to: data/demo.db
win:
  target:
    - nsis
    - portable
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: assets/icon.ico
portable:
  artifactName: ${productName}-portable-${version}.exe
```

#### B7.2 Prisma 打包注意

Prisma 的 `query_engine-windows.dll.node` 是最大的风险点。确保：

1. 在打包前执行 `prisma generate`（生成 Windows 引擎）
2. 将 `node_modules/.prisma/client` 和 `node_modules/prisma` 原样打包
3. 在 Windows CI 环境中构建后端（而不是跨平台构建）
4. 测试在干净 Windows 10/11 上可运行

### B8 — 安全声明

EXE 启动时显示：

```
⚠️ 本地演示版声明

本应用为 AI 心理健康助手的本地演示版本，仅供个人体验和学习用途。
- 所有数据保存在你的电脑本地，不会上传到任何服务器
- AI 聊天功能默认使用模拟回复，不会产生 AI API 费用
- 如填入 AI API Key，Key 仅保存在你的电脑上
- 本应用不提供医疗诊断、处方或心理治疗
- 如遇紧急情况，请拨打 110 或心理援助热线 400-161-9995

[ ] 我已了解以上声明（继续使用）
```

---

## 推进顺序

```
Phase 1: 部署准备收口（当前阶段）
  ├─ A1: 修复 Docker 3 个缺陷
  ├─ A2: 统一配置管理
  ├─ A3: 更新 README 三种运行方式
  └─ 验证: docker compose up 全链路成功

Phase 2: Electron 桌面版开发
  ├─ B1-B3: Electron 壳 + 子进程管理
  ├─ B4: 内置 demo.db + seed
  ├─ B5: Mock AI + 可选 Key 设置页
  ├─ B6: 端口管理
  └─ 验证: Electron 启动全链路 + 聊天 + 日记

Phase 3: EXE 打包与测试
  ├─ B7: electron-builder 打包
  ├─ B8: 安全声明弹窗
  └─ 验证: 干净 Windows 10/11 虚拟机测试
```

---

## 验证检查表

### Phase 1 验收

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | 前端构建 | `npm run build` |
| 2 | 后端构建 | `cd server && npm run build` |
| 3 | 前端测试 | `npm run test`（60/60） |
| 4 | 后端测试 | `cd server && npm run test:unit`（113/113） |
| 5 | Docker 构建 | `docker compose build --no-cache` |
| 6 | Docker 启动 | `docker compose up -d` |
| 7 | 健康检查 | `curl http://localhost:8000/health` |
| 8 | 登录接口 | `curl -X POST http://localhost:8000/api/user/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123456"}'` |
| 9 | 数据库迁移 | `docker compose exec backend npx prisma migrate status` |
| 10 | 文件上传持久化 | 上传文件后 `docker compose down && docker compose up -d`，确认文件仍在 |

### Phase 2 验收

| # | 检查项 |
|---|--------|
| 1 | 双击 Electron 启动，前端页面正常加载 |
| 2 | AI 聊天 Mock 流式输出正常 |
| 3 | 情绪日记 CRUD 正常 |
| 4 | 填入真实 DeepSeek Key 后，AI 回复正常 |
| 5 | 重启后 Key 仍存在（config.json 持久化） |
| 6 | 重置演示数据后，admin 可登录 |
| 7 | 关闭窗口后后端进程退出（无残留） |

### Phase 3 验收

| # | 检查项 |
|---|--------|
| 1 | electron-builder 打包成功（exe/installer） |
| 2 | 在干净 Windows 10 上安装/运行成功 |
| 3 | 在干净 Windows 11 上安装/运行成功 |
| 4 | 不含真实 API Key（`strings *.exe \| grep sk-` 无输出） |
| 5 | 不含 .env 真实配置 |
| 6 | 安全声明弹窗在首次启动时显示 |
