# 开源前复查计划与维护提示

日期：2026-05-14  
适用版本：v2.6.0

## 目标

本文件只用于开源发布前复查，不记录完整功能进度。目标是确保项目在公开仓库、Docker 部署、Windows EXE 分发和后续维护上具备清晰、可执行的准备流程。

## 复查原则

- 先确认没有敏感信息，再做构建和打包。
- 先验证 Web 主线，再验证桌面 EXE。
- 先保证安装版可用，再考虑 portable。
- 文档必须能指导外部用户 clone、启动、部署和反馈问题。
- EXE 本地演示版只用于演示，不作为生产部署替代品。

## 开源前逐步准备

### Step 1：检查工作区状态

确认哪些文件将进入本次提交：

```powershell
git status --short
git diff --name-only
```

重点确认：

- 没有误提交 `dist/`、`node_modules/`、`desktop/dist-electron*/`。
- 没有误提交本地 `.env`。
- 没有误提交测试报告、临时文件、日志文件。

### Step 2：检查敏感信息

确认本地环境文件未被 Git 跟踪：

```powershell
git ls-files .env server/.env
```

正常情况下不应有输出。

搜索疑似密钥：

```powershell
git grep -n -I -E "sk-[A-Za-z0-9]{8,}|sk-or-v1-[A-Za-z0-9]{8,}|DEEPSEEK_API_KEY=sk-|OPENAI_API_KEY=sk-"
```

如有命中，必须判断是否只是文档占位符。建议文档统一使用：

```env
DEEPSEEK_API_KEY=<your_deepseek_api_key>
```

不要使用形似真实密钥的 `sk-xxx`。

### Step 3：复查环境模板

重点查看：

- `server/.env.example`
- `server/.env.production`
- `docker-compose.yml`

确认：

- 没有真实 API Key。
- 没有真实数据库密码。
- 没有真实 JWT Secret。
- 生产说明中明确要求用户自行修改默认密码。

注意：`server/.env.production` 当前是模板值。长期建议改名为：

```text
server/.env.production.example
```

### Step 4：复查开源基础文件

确认以下文件存在并内容可读：

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.editorconfig`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `docs/open-source-readiness.md`

重点检查 README：

- 项目定位是否准确。
- 启动方式是否清楚。
- Docker 部署说明是否可执行。
- Windows EXE 说明是否注明“本地演示版”。
- 是否避免医疗诊断、治疗替代等不当表述。

### Step 5：同步版本号

确认版本号一致：

```powershell
node -e "for (const f of ['package.json','server/package.json','desktop/package.json']) { const j=require('./'+f); console.log(f, j.version, j.license) }"
```

期望：

```text
package.json 2.6.0 MIT
server/package.json 2.6.0 MIT
desktop/package.json 2.6.0 MIT
```

如果修改了 package 元数据，需要同步 lockfile：

```powershell
npm.cmd install --package-lock-only --ignore-scripts
npm.cmd install --package-lock-only --ignore-scripts --prefix server
npm.cmd install --package-lock-only --ignore-scripts --prefix desktop
```

### Step 6：执行 Web 构建与测试

前端：

```powershell
npm run build
npm run test
```

后端：

```powershell
npm run build --prefix server
npm run test:unit --prefix server
```

通过标准：

- 前端构建成功。
- 前端测试通过。
- 后端构建成功。
- 后端单测通过。

如本地测试失败，不要直接发布。先判断是环境问题、测试数据问题还是功能回归。

### Step 7：验证 Docker 部署线

建议执行：

```powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs backend --tail 120
```

重点检查：

- MySQL healthy。
- backend 正常启动。
- frontend 正常启动。
- backend 可以连接数据库。
- uploads volume 已挂载。
- 后端端口没有直接暴露到公网地址。

验证结束后可关闭：

```powershell
docker compose down
```

### Step 8：重新生成桌面版构建产物

Electron 加载的是根目录 `dist` 和 `server/dist/main.js`。如果改过前端或后端，必须先构建：

```powershell
npm run build
npm run build --prefix server
```

再进入 desktop 打包：

```powershell
cd desktop
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
npm run dist -- --config.win.signAndEditExecutable=false
```

说明：

- 镜像用于避免 electron-builder 下载 NSIS 工具超时。
- `signAndEditExecutable=false` 是当前未配置代码签名证书时的本地打包方案。
- 正式商业分发应补代码签名证书。

### Step 9：验证 Windows EXE

优先验证安装版：

```text
desktop/dist-electron/AI心理健康助手 Setup 2.6.0.exe
```

如果文件名仍显示 `1.0.0`，说明 `desktop/package.json` 版本或重新打包未生效。

人工验收清单：

- 首次启动显示安全声明。
- `admin/admin123456` 可登录。
- `testuser/test123456` 可登录。
- Mock AI 对话可用。
- 情绪日记 CRUD 可用。
- 知识文章浏览详情可用。
- 投稿/编辑文章封面上传预览可用。
- 设置弹窗可保存 API Key。
- 重启后 API Key 仍在。
- 重置演示数据后 admin 仍可登录。
- 关闭窗口后无残留后端进程。

### Step 10：处理本地演示数据库残留

EXE 会优先使用：

```text
%APPDATA%/ai-mental-health/demo.db
```

如果本地已经存在旧库，重新打包不会覆盖它。遇到登录失败或数据不一致时，关闭应用后删除：

```powershell
Remove-Item "$env:APPDATA\ai-mental-health\demo.db" -Force -ErrorAction SilentlyContinue
```

重新启动后，应用会从内置 `desktop/data/demo.db` 复制最新演示库。

### Step 11：检查 EXE 包内敏感信息

至少确认：

- 包内没有真实 API Key。
- 包内没有 `.env`。
- 包内没有用户本地 `config.json`。

重点提醒：

- API Key 只能保存到用户机器的 `%APPDATA%/ai-mental-health/config.json`。
- `desktop/data/demo.db` 只能包含演示数据。

### Step 12：准备 GitHub 发布

建议发布前完成：

- GitHub 仓库启用 Issues。
- GitHub 仓库启用 Security advisories。
- 设置 topics：
  - `vue`
  - `nestjs`
  - `electron`
  - `docker`
  - `mental-health`
- 设置 branch protection：
  - PR 必须通过 CI。
  - 禁止直接 push main。
- Release notes 明确说明：
  - Web 部署方式。
  - Windows 安装包用途。
  - 本项目不提供医疗诊断。
  - DeepSeek API Key 由用户自行配置。

## 发布物建议

对普通用户或验收方，优先提供：

```text
AI心理健康助手 Setup 2.6.0.exe
```

不建议优先提供 portable，因为 portable 每次启动都要自解压，启动体验通常慢于安装版。

`.blockmap` 主要用于自动更新场景。当前没有接入自动更新时，不需要单独发给普通用户。

## 后续维护注意事项

### 1. 每次改前端后都要重新 build

桌面版不会直接读取 `src/`。如果改了 Vue 页面但没有执行：

```powershell
npm run build
```

EXE 中仍然是旧页面。

### 2. 每次改后端后都要重新 build

Electron 加载的是：

```text
server/dist/main.js
```

如果改了后端源码但没有执行：

```powershell
npm run build --prefix server
```

EXE 中仍然是旧后端。

### 3. 不要提交真实配置

禁止提交：

- 真实 `.env`
- 真实 API Key
- 真实数据库密码
- 真实 JWT Secret
- 真实用户数据
- 生产数据库备份

### 4. 演示数据和生产数据要分开

`demo.db` 只用于本地演示。生产部署必须使用 MySQL 或其他正式数据库，不要把 demo.db 当作生产替代品。

### 5. Desktop 变更要同时考虑三处

涉及桌面版时通常要同时检查：

- 前端 `dist`
- 后端 `server/dist`
- Electron `desktop/main.js` / `desktop/preload.js` / `desktop/electron-builder.yml`

### 6. Portable 慢启动不是首选优化方向

portable 天然需要自解压。更现实的分发策略是：

- 正常用户使用安装版。
- 免安装场景才使用 portable。
- 真要优化 portable，应继续减少打包文件数量，而不是只压缩单个文件大小。

### 7. 安全声明必须保留

Windows EXE 本地演示版必须保留首次启动安全声明，避免用户误解为医疗诊断或心理治疗工具。

### 8. 依赖升级要走测试

升级以下依赖后必须执行完整验证：

- Vue / Vite / Element Plus
- NestJS
- Prisma
- Electron
- electron-builder
- DeepSeek/OpenAI SDK 兼容层

### 9. Release 之后要记录变更

每次正式发布后更新：

- `CHANGELOG.md`
- GitHub Release Notes
- 必要时更新 `README.md`
- 必要时更新部署文档

## 建议的下一阶段工作

### 优先级高

- 增加 GitHub Release workflow。
- CI 加入 Playwright E2E。
- 在干净 Windows 10/11 验证安装包。
- 将 `server/.env.production` 调整为 example 文件。

### 优先级中

- 增加 Dependabot。
- 增加 Docker Compose smoke test。
- 补独立桌面发布文档 `docs/desktop-release.md`。
- 管理端也接入桌面设置入口，方便 admin 配置 API Key 和重置演示数据。

### 优先级低

- Commitlint + Husky。
- Docker 镜像发布到 GHCR。
- GitHub Pages 或 Wiki。
- 更完整的运维监控与备份脚本。
