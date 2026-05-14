# 部署 + 开源上线计划

> **部署 Phase 1~3 已于 2026-05-14 全线完成验收。**
> 本文档同步管理开源流程推进计划。

---

## 完成情况

```
Phase 1: 部署准备收口 ✅ 已完成
  ├─ A1: 修复 Docker 3 个缺陷 ✅
  ├─ A2: 统一配置管理 ✅
  ├─ A3: 更新 README 三种运行方式 ✅
  └─ 验证: 前后端构建通过，60 前端 + 113 后端测试全绿

Phase 2: Electron 桌面版开发 ✅ 已完成
  ├─ B1-B3: Electron 壳 + 子进程管理 ✅
  ├─ B4: 内置 demo.db + seed ✅
  ├─ B5: Mock AI + 可选 Key 设置页 ✅
  ├─ B6: 端口管理 ✅
  └─ 验证: Electron 启动全链路 + 聊天 + 日记

Phase 3: EXE 打包与测试 ✅ 已完成
  ├─ B7: electron-builder 打包 ✅（NSIS + portable x64 产物就绪）
  ├─ B8: 安全声明弹窗 ✅
  └─ 验证: 安全审计通过（无 API Key 泄露），干净 Windows 待人工验收
```

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

### A1 — Docker Compose 缺陷修复（已修复 ✅）

#### A1.1 Backend Dockerfile 迁移文件缺失

**修复：** `server/Dockerfile` 复制完整 `prisma/` 目录（含 migrations），`docker-entrypoint.sh` 使用 `prisma migrate deploy --schema=prisma/schema.prisma`。

#### A1.2 uploads 目录持久化缺失

**修复：** `docker-compose.yml` 添加 `uploads_data:/app/uploads` volume。

#### A1.3 生产端口暴露问题

**修复：** 后端端口改为 `127.0.0.1:8000:8000`，仅本机绑定。

### A2 — 统一配置管理（已完成 ✅）

- DeepSeek 默认模型统一为 `deepseek-v4-flash`（`.env.production`、`docker-compose.yml`、`.env.example` 均已一致）
- `.env.production` 补充 `CRISIS_HOTLINE` / `CRISIS_HOTLINE_NAME`

### A3 — README 三种运行方式（已完成 ✅）

README.md 明确列出开发运行、Docker 部署、Windows EXE 三种方式及适用场景。

### A4 — Docker 安全加固（待后续完善）

1. COMPOSE_BAKE 或 build secrets 管理敏感信息
2. 后端 Dockerfile 添加非 root 用户运行
3. MySQL 自定义 Dockerfile 与 root password
4. Health 检查完善

> 注：A4 不属于 P1~P3 范围，作为持续改进项留待后续。

---

## 路线 B · 本地演示 EXE 线

### B1 — 技术选型（已完成 ✅）

| 项目 | 选择 | 原因 |
|------|------|------|
| 桌面壳 | **Electron 33** | Node 生态原生，启动 NestJS 子进程自然 |
| 数据库 | **SQLite**（Prisma 内置管理） | 体积小，零配置，适合本地演示 |
| AI | **Mock AI 默认**，可选填 Key | 不内置 Key，合规安全 |
| 打包工具 | **electron-builder** | 成熟稳定，NSIS/portable 都支持 |
| 前端 | **Vue dist 静态文件** | Electron 直接加载 `dist/index.html` |

### B2 — 目录结构（已完成 ✅）

```
desktop/
  main.js                  # Electron 主进程
  preload.js               # 预加载脚本（安全暴露 API）
  package.json             # Electron 项目依赖与脚本
  electron-builder.yml     # 打包配置
  assets/
    icon.ico               # 应用图标
  scripts/
    prepare-runtime.js     # 打包前准备精简后端运行时
    generate-icon.js       # 图标生成工具
  data/
    demo.db                # 内置演示数据库（含 seed 数据）
```

### B3 — 运行流程（已完成 ✅）

```
用户双击 ai-mental-health.exe
  │
  ├─ 1. Electron 主进程启动 → 显示加载窗口
  ├─ 2. 安全声明弹窗（首次启动）
  ├─ 3. 分配随机可用端口
  ├─ 4. 检查/复制 demo.db 到 %APPDATA%
  ├─ 5. 启动 NestJS 子进程（fork dist/main.js）
  ├─ 6. 轮询 /health 等待服务就绪
  ├─ 7. 创建 BrowserWindow，加载内嵌 Vue 前端
  ├─ 8. 用户关闭窗口 → 清理子进程 → 退出
```

### B4 — 数据方案（已完成 ✅）

- 首次启动：复制 `data/demo.db` 到 `%APPDATA%/ai-mental-health/`
- 重置功能：通过设置页 IPC 删除并重新复制数据库 + 重启后端
- 预置 seed：admin/admin123456、testuser/test123456、示例文章、示例日记

### B5 — Mock AI + 可选 Key 方案（已完成 ✅）

- 默认 Mock AI：未配置 `DEEPSEEK_API_KEY` 时自动降级
- 设置弹窗 `SettingsDialog.vue`：可填入 Key，保存到 `config.json`，自动重启后端

### B6 — 端口管理（已完成 ✅）

- `getRandomPort()` 使用 `net.createServer` 获取随机可用端口
- `preload.js` 通过 `contextBridge` 暴露 API 配置

### B7 — 打包配置（已完成 ✅）

- `electron-builder.yml`：NSIS 安装包 + portable 自解压 exe
- 后端运行时精简：`prepare-runtime.js` 剔除开发依赖，从 287MB 降到 45.7MB
- 安全审计：包内无 API Key 明文、无 `.env` 文件

### B8 — 安全声明（已完成 ✅）

首次启动强制显示安全声明弹窗，勾选同意后方可继续使用。

---

## 历史验证检查表

### Phase 1 验收（全部通过 ✅）

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 前端构建 `npm run build` | ✅ 通过 |
| 2 | 后端构建 `cd server && npm run build` | ✅ 通过 |
| 3 | 前端测试 60/60 | ✅ 通过 |
| 4 | 后端测试 113/113 | ✅ 通过 |

### Phase 2 验收（全部通过 ✅）

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 双击 Electron 启动，前端页面正常加载 | ✅ 通过 |
| 2 | AI 聊天 Mock 流式输出正常 | ✅ 通过 |
| 3 | 情绪日记 CRUD 正常 | ✅ 通过 |
| 4 | 填入真实 DeepSeek Key 后，AI 回复正常 | ✅ 通过 |
| 5 | 重启后 Key 仍存在（config.json 持久化） | ✅ 通过 |
| 6 | 重置演示数据后，admin 可登录 | ✅ 通过 |
| 7 | 关闭窗口后后端进程退出（无残留） | ✅ 通过 |

### Phase 3 验收（核心完成 ✅）

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | electron-builder 打包成功（exe/installer） | ✅ 通过 |
| 2 | 干净 Windows 10 上安装/运行成功 | ⏳ 待人工验收 |
| 3 | 干净 Windows 11 上安装/运行成功 | ⏳ 待人工验收 |
| 4 | 不含真实 API Key（无 `sk-` 明文） | ✅ 通过 |
| 5 | 不含 .env 真实配置 | ✅ 通过 |
| 6 | 安全声明弹窗在首次启动时显示 | ✅ 通过 |

---

## 路线 C · 开源流程计划

### 背景

部署三阶段完成后，项目核心功能完备。补齐开源基础设施，使其达到标准开源项目的可接受水平。

### 当前状态

| 项目 | 状态 | 说明 |
|------|------|------|
| README.md | ✅ 已有 | 完整，含三方式说明 |
| CHANGELOG.md | ✅ 已有 | Keep a Changelog 格式 |
| LICENSE (MIT) | ✅ 已有 | 已提交 |
| CONTRIBUTING.md | ✅ 已有 | 含 PR 流程与提交规范 |
| CI (GitHub Actions) | ✅ 已有 | 前后端构建 + lint + 测试 |
| Prettier | ✅ 已有 | 根目录配置 |


### Phase C1 — 文档补全（当前阶段）

| # | 文件 | 说明 | 优先级 |
|---|------|------|--------|
| 1 | `CODE_OF_CONDUCT.md` | 采用 Contributor Covenant v2.1，中英双语 | 高 |
| 2 | `SECURITY.md` | 安全漏洞报告流程、受支持版本、响应时间 | 高 |
| 3 | `.github/ISSUE_TEMPLATE/bug_report.md` | Bug 模板：描述/复现/环境/严重程度 | 高 |
| 4 | `.github/ISSUE_TEMPLATE/feature_request.md` | 功能请求模板：描述/场景/替代方案 | 高 |
| 5 | `.github/PULL_REQUEST_TEMPLATE.md` | PR 模板：变更摘要/关联 Issue/测试说明/截图 | 中 |
| 6 | `package.json` 元数据修复 | 根 `"version": "2.6.0"` + `"license": "MIT"` | 中 |
| 7 | `.editorconfig` | charset/indent/eol/trim 统一 | 低 |

### Phase C2 — 流程加固

| # | 项目 | 说明 |
|---|------|------|
| 8 | GitHub Release 工作流 | 打 tag 时自动构建、生成 Release Notes、上传 artifacts（前端 dist、EXE） |
| 9 | ESLint 配置补全 | 根目录安装 eslint + eslint-plugin-vue，使 CI lint 步骤生效 |
| 10 | E2E 接入 CI | `ci.yml` 增加 Playwright job |
| 11 | 分支策略文档化 | CONTRIBUTING.md 补充 main/dev/feature/fix 分支命名规则 |

### Phase C3 — 持续优化

| # | 项目 | 说明 | 优先级 |
|---|------|------|--------|
| 12 | Dependabot 配置 | 每周 npm 依赖更新检查 | 中 |
| 13 | Docker 镜像发布 | release 时 push 到 GitHub Container Registry | 低 |
| 14 | Issue 标签体系 | bug/enhancement/docs/good first issue/help wanted | 低 |
| 15 | Commitlint + Husky | commit-msg 钩子校验 Conventional Commits | 低 |
| 16 | GitHub Pages / Wiki | 文档站点或前端 demo page | 低 |

### 实施顺序

```
Phase C1: 文档补全 ← 当前阶段
  ├─ CODE_OF_CONDUCT.md
  ├─ SECURITY.md
  ├─ Issue 模板 × 2 + PR 模板
  ├─ package.json 元数据
  └─ .editorconfig

Phase C2: 流程加固 ← 下一阶段
  ├─ Release 工作流
  ├─ ESLint 配置
  ├─ E2E 集成 CI
  └─ 分支策略文档化

Phase C3: 持续优化 ← 长期
  ├─ Dependabot
  ├─ Docker 镜像发布
  ├─ Issue 标签 / Commitlint / GitHub Pages
```

### 验收方式

1. 各文档文件 `CODE_OF_CONDUCT.md` / `SECURITY.md` 等存在且内容完整
2. `package.json` 确认 `license` 和 `version` 字段正确
3. Issue/PR 模板在 GitHub 仓库 Settings 中可选择
4. Release 工作流需创建 tag 后触发验证
5. CI 中 Playwright E2E job 通过
