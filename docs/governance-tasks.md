# 项目治理任务拆解

> 基于 2026-05-11 仓库审查结果。按"单窗口单目标"原则拆解，每个任务自带完整提示词，可直接复制到新对话窗口执行。

## 完成状态总览

| 任务 | 状态 | 完成日期 | 说明 |
|------|------|---------|------|
| 任务 1：仓库目录结构统一 | ✅ 已完成 | 2026-05-11 | `ai-vue project/` → 根目录，Git 识别为重命名，提交 `b441a77` |
| 任务 2：文档收敛 | ✅ 已完成 | 2026-05-11 | 版本号统一为 v2.3.1，旧路径已修正 |
| 任务 3：仓库卫生与安全底线 | ✅ 已完成 | 2026-05-11 | `node_modules/` 取消跟踪，`.gitignore` 覆盖 `.claude/settings*.json`，API Key 脱敏 |
| 任务 4：Docker 与脚本路径修正 | ✅ 已完成 | 2026-05-11 | `docker compose config` 通过，`start-dev.ps1` 路径正确 |
| 任务 5：心理健康 AI 产品安全边界 | ✅ 已完成 | 2026-05-11 | ClientChat.vue 免责声明 + 危机热线，ai.service.ts 高危关键词检测 & 系统提示词增强 |
| 任务 6：CLAUDE.md 精简 + AI 交接模板 | ✅ 已完成 | 2026-05-11 | CLAUDE.md 198 行（< 250），docs/ai-handoff.md 和 docs/current-state.md 已创建并引用 |
| 任务 7：修复 Vite 代理 SSE 缓冲 | ✅ 已完成 | 2026-05-11 | vite.config.js 配置 proxyRes 钩子，对 /chat/send 禁用缓冲 |

---

## 任务 1：仓库目录结构统一 ✅

**优先级**：P0（阻塞所有后续工作）
**预计工作量**：1 个对话窗口

### 背景

当前仓库根目录 `d:\ai-vue\` 和真实应用目录 `d:\ai-vue\ai-vue project\` 分裂：
- 根目录有孤立的 `Dockerfile`、`docker-compose.yml`、`package.json`、`node_modules/`
- 真实前后端代码全在 `ai-vue project/` 子目录
- 根目录有 `.claude/`，子目录也有 `.claude/`
- `scripts/start-dev.ps1` 混用 `$RootDir/server` 和 `$RootDir/ai-vue project` 两种路径

### 允许改动范围

- 将 `ai-vue project/` 所有内容提升到仓库根目录（推荐方案）
- 或将其改名为 `app/` 并同步更新所有引用路径
- 更新根 `README.md`、`scripts/start-dev.ps1`、根 `Dockerfile`、`docker-compose.yml` 的路径引用
- 仅保留一个 `.claude/` 目录（在根目录）
- 删除根目录无用的 `package.json`（仅含 sass devDependency 的孤立文件）

### 禁止触碰

- 不修改 `ai-vue project/src/` 下任何业务代码
- 不修改 `ai-vue project/server/src/` 下任何业务代码
- 不修改 Prisma schema
- 不修改 vite.config.js 的功能逻辑（只改路径相关）

### 验收命令

```powershell
# 前端构建通过
cd "ai-vue project" && npm run build

# 后端构建通过
cd "ai-vue project/server" && npm run build

# 一键启动脚本路径正确
.\scripts\start-dev.ps1  # 应能成功启动

# Docker Compose 配置有效
docker compose config  # 应无错误
```

### 新窗口提示词

```
## 目标
统一仓库目录结构。当前仓库根目录 `d:\ai-vue\` 和真实应用目录 `d:\ai-vue\ai-vue project\` 分裂，
需要将 `ai-vue project/` 内容提升到根目录，并修正所有路径引用。

## 仓库当前结构
- 根目录 (`d:\ai-vue\`)：README.md、CHANGELOG.md、CONTRIBUTING.md、LICENSE、
  Dockerfile、docker-compose.yml、package.json(孤立文件，仅含sass)、node_modules/、scripts/start-dev.ps1、.claude/
- 真实应用 (`d:\ai-vue\ai-vue project\`)：src/、server/、docs/、vite.config.js、package.json、.claude/、README.md

## 要求
1. 将 `ai-vue project/` 内所有内容移至仓库根目录
2. 合并 .claude/ 目录（子目录 settings 优先保留，根目录如有同名文件则合并）
3. 删除孤立的根 package.json 和根 node_modules/
4. 更新 scripts/start-dev.ps1 中的路径引用
5. 更新根 Dockerfile 中的 COPY 路径（context 现在是根目录本身）
6. 更新 docker-compose.yml 中的 build context 路径
7. 确保 .gitignore 存在（如不存在则创建），覆盖 node_modules、.env、dist、uploads、test-results
8. 完成后验证：前端 build、后端 build、docker compose config

## 禁止
- 不修改 src/ 和 server/src/ 下任何业务代码
- 不修改 Prisma schema
- 不改 vite.config.js 功能逻辑

## 验收
- 前端 `npm run build` 通过
- 后端 `cd server && npm run build` 通过
- `docker compose config` 无错误
- 根目录不再有孤立的 package.json
```
```

---

## 任务 2：文档收敛 — 消除三份文档的版本冲突 ✅

**优先级**：~~P0~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- 版本号在 `README.md`、`docs/project-fullstack-plan.md` 中统一为 v2.3.1
- `project-fullstack-plan.md` 架构图路径 `ai-vue project/` → `.`
- `v1.2.0` 仅出现在 `governance-tasks.md`（历史描述），无当前版本声明残留

### 原背景（备查）

| 文件 | 声称版本 | 问题 |
|------|---------|------|
| 根 `README.md` | 未直接标版本 | 结构描述基于旧目录 |
| `ai-vue project/README.md` | v1.2.0 | 落后于实际进度（v2.3.1） |
| `project-fullstack-plan.md` | v2.3.1 / Phase 0-8 ✅ | 正确 |
| `task-backlog.md` | P0-P5 共 21 待办 | 多数项目在计划书 §19 中已标记完成 |

### 允许改动范围

- 以 `project-fullstack-plan.md` 为权威源
- 更新 `ai-vue project/README.md` 至 v2.3.1，同步接口列表、功能状态
- 更新 `task-backlog.md`：已完成项移入"已完成"表，与计划书 §19 对齐
- 更新根 `README.md`：版本号 + 正确的目录路径
- 三份文档的版本号和完成状态必须一致

### 禁止触碰

- 不改计划书 §1-§18 的内容结构
- 不改业务代码
- 不改 CLAUDE.md（留给任务 6）

### 验收命令

```bash
# 三份文档版本号一致
grep -r "v2.3.1" README.md "ai-vue project/README.md" "ai-vue project/docs/project-fullstack-plan.md"
grep -r "v1.2.0" .  # 应无结果（或仅在 CHANGELOG 历史条目中出现）
```

### 新窗口提示词

```
## 目标
消除项目三份文档之间的版本冲突和状态矛盾。以 `docs/project-fullstack-plan.md`（v2.3.1，Phase 0-8 全部完成）为权威源，
统一 `README.md`、`ai-vue project/README.md`、`docs/task-backlog.md` 的版本号和完成状态。

## 当前冲突
1. `ai-vue project/README.md` 标 v1.2.0，实际已是 v2.3.1
2. `docs/task-backlog.md` 有 21 项"待办"（P0 4项、P1 2项等），但计划书 §19 已标记它们"全部解决"
3. 根 `README.md` 的目录结构描述基于旧布局

## 要求
1. 更新 `ai-vue project/README.md`：
   - 版本 → v2.3.1
   - 功能状态与计划书对齐（用户端聊天管理、Dashboard ECharts、审核通知等）
   - 接口列表与当前代码对齐
2. 更新 `docs/task-backlog.md`：
   - P0-P2 中已在 v2.3.1 解决的项 → 移入"已完成"分区（保留记录，不删除）
   - 仅保留真正未完成的项（P3 Docker/CI/E2E、P4 Dashboard图表、P5 移动端/i18n/WebSocket）
   - 更新汇总数字
3. 更新根 `README.md`：版本号 v2.3.1，目录路径与任务 1 后的实际结构对齐
4. 确保三份文档对"当前版本是什么"给出相同答案

## 禁止
- 不修改计划书 §1-§18
- 不修改业务代码
- 不修改 CLAUDE.md（留给后续任务）

## 验收
- 所有 README/backlog 中版本号为 v2.3.1
- `grep -r "v1.2.0" .` 仅在 CHANGELOG 历史条目中出现
- backlog 待办数量与计划书遗留问题一致
```
```

---

## 任务 3：仓库卫生与安全底线 ✅

**优先级**：~~P0~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- `.gitignore` 已涵盖 `node_modules/`、`.env`、`.claude/settings*.json`、`dist/`、`test-results/` 等
- `git ls-files` 确认无 `.env`、`node_modules`、`settings.local.json` 被跟踪
- `.claude/settings.json` 中的真实 DeepSeek Key 已脱敏为 `sk-********`，旧路径 `git -C ..` 权限已清理
- **注意**：`server/.env` 仍含同一把 Key，虽已被 `.gitignore` 保护，建议本地轮换

### 原背景（备查）

- 根目录无 `.gitignore`，`node_modules/` 已被 Git 跟踪
- `.claude/settings.local.json` 可能包含本地命令记录（含疑似 API Key）
- 需确认 `server/.env` 未提交

### 允许改动范围

- 创建/完善 `.gitignore`：node_modules、.env、dist、uploads、test-results、*.log、.claude/settings.local.json
- 从 Git 跟踪中移除 `node_modules/`（`git rm -r --cached node_modules/`）
- 检查 `.claude/settings.local.json` 内容，如有敏感信息则清理并确保 `.gitignore` 覆盖
- 检查 `server/.env` 是否在 `.gitignore` 且未被跟踪
- 检查是否有其他不应提交的文件被跟踪

### 禁止触碰

- 不删除任何业务代码
- 不修改 settings.json 的功能性配置
- 不修改 .env.example（模板文件应保留）

### 验收命令

```bash
git status  # node_modules/ 不再出现在 tracked files 中
git ls-files | grep -E "node_modules|\.env$"  # 应无结果（.env.example 除外）
git ls-files | grep "settings.local.json"  # 应无结果
```

### 新窗口提示词

```
## 目标
清理仓库安全和卫生问题，确保可以安全地推送到 GitHub / 开源展示。

## 当前问题
1. 根目录没有 `.gitignore`，导致 `node_modules/` 被 Git 跟踪
2. `.claude/settings.local.json` 可能包含本地命令记录（含疑似 API Key 路径），必须确保不被提交
3. 需确认 `server/.env` 未被跟踪
4. 需确认 `uploads/`、`dist/`、`test-results/` 等本地产物未被跟踪

## 要求
1. 创建/完善 `.gitignore`，至少包含：
   - node_modules/
   - .env（保留 .env.example）
   - dist/
   - uploads/
   - test-results/
   - *.log
   - .claude/settings.local.json
2. 从 Git 跟踪中移除 node_modules/：
   git rm -r --cached node_modules/
3. 检查 .claude/settings.local.json：
   - 读取内容，确认是否含敏感信息
   - 如果含 API Key 或 token，告知用户手动清理
   - 确保它被 .gitignore 覆盖
4. 检查 server/.env 是否在 .gitignore 且未被 Git 跟踪
5. git status 确认清理干净
6. 如发现其他大文件/二进制文件被误跟踪，一并处理

## 禁止
- 不删除 settings.json（项目配置需要保留）
- 不修改 .env.example
- 不删除业务代码

## 验收
- `git status` 干净（node_modules/ 不再出现）
- `git ls-files | grep -E "node_modules|\.env$"` 无结果（.env.example 除外）
- `git ls-files | grep "settings.local.json"` 无结果
```
```

---

## 任务 4：Docker 与脚本路径修正 ✅

**优先级**：~~P0~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- `docker compose config` 解析正常，context 正确指向 `D:\ai-vue\server` 和 `D:\ai-vue`
- `scripts/start-dev.ps1` 路径变量正确：`$ServerDir = server/`，`$FrontendDir` = 根目录

### 原背景（备查）

- 根 `Dockerfile` 的 context 是 `.`（根目录），但实际前端源码在 `ai-vue project/`
- 根 `docker-compose.yml` 中 backend build context 为 `./server`，但真实 server 在 `ai-vue project/server/`
- `scripts/start-dev.ps1` 中 `$ServerDir = Join-Path $RootDir "server"` 指向不存在的路径

### 允许改动范围

- 修正根 `Dockerfile`：COPY 路径指向实际前端目录
- 修正 `docker-compose.yml`：所有 build context 和路径引用
- 修正 `scripts/start-dev.ps1`：所有路径变量
- 如任务 1 已完成（目录统一），则重新验证这些文件
- 如有 nginx.conf 引用，同步修正

### 禁止触碰

- 不改 Docker 镜像选型（node:20-alpine、nginx:alpine、mysql:8.0）
- 不改端口映射（8000、8080）
- 不改环境变量名

### 验收命令

```bash
docker compose config  # 验证配置解析正确
docker compose build  # 验证构建成功（如 Docker 可用）
```

### 新窗口提示词

```
## 目标
修正根目录 Dockerfile、docker-compose.yml、scripts/start-dev.ps1 中的路径，
使它们指向实际存在的目录和文件。

## 当前问题
1. 根 Dockerfile：`COPY package.json`、`COPY src/` 等假设前端在根目录，
   但实际在 `ai-vue project/`（如任务 1 已完成则在根目录）
2. docker-compose.yml：backend build context `./server` 实际是 `ai-vue project/server/`
3. scripts/start-dev.ps1：`$ServerDir = Join-Path $RootDir "server"` 指向不存在的路径

## 要求
1. 读取当前实际目录结构（注意任务 1 可能已改变结构）
2. 修正 Dockerfile 中所有 COPY 路径，使其指向正确的 package.json、src/、vite.config.js 等
3. 修正 docker-compose.yml 中所有 build context 和路径引用
4. 修正 scripts/start-dev.ps1 中的 $ServerDir 和 $FrontendDir
5. 如果有 nginx.conf，同步修正其中的 root 路径
6. 验证：`docker compose config` 解析成功

## 目录实际情况
- 前端根（含 vite.config.js、package.json）：`ai-vue project/` 或根目录（取决于任务1是否完成）
- 后端（含 server/package.json）：`ai-vue project/server/` 或 `server/`
- 启动脚本：`scripts/start-dev.ps1`

## 禁止
- 不改镜像选型或端口
- 不改环境变量名
- 不添加新服务

## 验收
- `docker compose config` 无错误
- `scripts/start-dev.ps1` 中的路径实际存在
```
```

---

## 任务 5：心理健康 AI 产品安全边界 ✅

**优先级**：~~P1~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- ClientChat.vue 欢迎区增加非医疗声明 + 危机提示入口
- ClientLayout.vue footer 增加全局免责声明
- ai.service.ts 系统提示词增加高风险关键词优先输出危机资源
- Mock AI 模式检测高危词汇时返回预设危机热线（400-161-9995 / 010-82951332）
- `.env.example` 增加了 `CRISIS_HOTLINE` / `CRISIS_HOTLINE_NAME` 变量

### 原背景（备查）

**优先级**：P1（产品可信度与合规风险）

### 背景

当前 AI 系统提示词已包含基本免责声明，但产品层面还缺：
- 前端聊天界面没有明确的"非医疗诊断"声明
- 没有危机资源提示（心理援助热线）
- AI 输出没有免责标签
- 用户数据隐私边界不清晰

### 允许改动范围

- `ClientChat.vue`：欢迎区增加非医疗声明文案 + 危机提示入口
- `ai.service.ts`：系统提示词增强 — 在检测到高风险关键词时优先输出危机资源
- `server/.env.example`：增加可配置的心理援助热线变量
- 可选：在 `ClientLayout.vue` footer 增加全局免责声明
- 可选：`README.md` 增加产品安全边界说明

### 禁止触碰

- 不改认证/权限逻辑
- 不改 API 接口路径
- 不改数据库 schema
- 不修改 mock AI 的分析结果结构

### 验收命令

```bash
# 前端构建通过
npm run build
# 后端构建通过
cd server && npm run build
# 浏览器验证：打开 AI 咨询页面，确认欢迎区有免责声明
```

### 新窗口提示词

```
## 目标
为 AI 心理健康管理平台增加产品层面的安全边界：非医疗诊断声明、危机资源引导、AI 免责标识。

## 背景
当前系统提示词已包含基本免责，但用户界面和产品层面还缺少显式的安全边界。
心理健康场景风险高，这些边界影响产品可信度和合规风险。

## 要求

### 1. 前端 ClientChat.vue
- 在欢迎区（welcome-section）增加一行非医疗声明：
  "本助手为 AI 技术支持，不提供医疗诊断、处方或心理治疗。如有紧急情况，请拨打心理援助热线。"
- 在输入框上方增加常驻提示文字（小字灰色）：
  "AI 回复仅供参考，不能替代专业心理咨询"
- 在建议提问 chips 中增加一条危机导向的：
  "我需要心理援助热线"
  AI 对这条的 mock 回复应包含预设的危机资源信息

### 2. 后端 ai.service.ts
- 系统提示词增加一条硬规则：
  "当用户表达自伤、自杀或伤害他人意图时，优先提供心理援助热线信息，并强烈建议寻求专业帮助。"
- mock AI 模式增加：当用户消息匹配高风险关键词（自杀/自伤/不想活/结束生命等），
  返回预设危机资源（全国心理援助热线：400-161-9995，北京心理危机干预中心：010-82951332）
- 可选：在 .env.example 增加 CRISIS_HOTLINE 和 CRISIS_HOTLINE_NAME 变量，
  系统提示词动态读取

### 3. 其他
- README.md 增加"产品安全声明"小节：说明本平台定位、AI 能力边界、不替代专业医疗
- 可选：ClientLayout.vue footer 增加一行全局免责

## 禁止
- 不改认证/权限逻辑
- 不改 API 路径
- 不改数据库 schema
- 不修改 mock AI 分析结果结构

## 验收
- 前端 build 通过
- 后端 build 通过
- 浏览器确认：AI 咨询页欢迎区有免责声明、输入框上方有提示
- 发送"我不想活了" → AI 回复包含危机热线信息
```
```

---

## 任务 6：CLAUDE.md 精简 + AI 交接模板 ✅

**优先级**：~~P1~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- CLAUDE.md 精简至 198 行（上限 250），移除变化内容，保留稳定规则
- `docs/current-state.md` 已创建，承载版本号、完成记录、遗留问题
- `docs/ai-handoff.md` 已创建，含固定模板 + 进度同步检查清单
- CLAUDE.md 头部和末尾已添加交叉引用
- 稳定部分（分层约束、接口稳定、模型接入、安全规则）完整保留

### 原背景（备查）

**优先级**：P1（AI 协作效率）
**预计工作量**：1 个对话窗口

### 背景

当前 `ai-vue project/.claude/CLAUDE.md` 约 200+ 行，包含：
- 历史 Phase 完成记录（长流水账）
- 完整接口列表（易过期）
- 技术债务状态（与 backlog 重复）
- 进度同步规则（过程性规则）

问题：过长的 CLAUDE.md 在每轮对话中占用 context；变化内容与稳定规则混在一起。

### 允许改动范围

- 精简 CLAUDE.md 至 150-250 行
- 稳定部分保留：分层约束（§8）、接口稳定优先（§9）、模型接入规则（§10）、安全规则（§13）
- 变化内容移到 `docs/current-state.md`：版本号、完成记录、遗留问题
- 创建 `docs/ai-handoff.md` 模板（≤80 行/次）
- 进度同步规则（§21）移到 handoff 模板中作为检查清单

### 禁止触碰

- 不修改业务代码
- 不修改文档内容（只重组、不重写）
- 保留 CLAUDE.md 中所有硬性约束（§8-§15）

### 验收命令

```bash
wc -l .claude/CLAUDE.md  # ≤ 250 行
```

### 新窗口提示词

```
## 目标
精简 CLAUDE.md 至 150-250 行，将变化内容移出到独立文件，创建 AI 交接模板。

## 背景
当前 CLAUDE.md 约 200+ 行，混合了稳定规则和频繁变化的版本状态/完成记录。
每次对话 CLAUDE.md 都被全量加载，过长会侵占上下文窗口。
同时需要一个轻量的交接模板，方便多窗口切换时快速恢复上下文。

## 要求

### 1. 精简 CLAUDE.md
保留以下稳定部分（这些不会因版本变化而频繁修改）：
- §1-4：行为规则（先想清楚再写、最小实现、手术式改动、目标驱动）
- §5：项目定位（当前版本号从 docs/current-state.md 引用）
- §8：前后端分层（不可打乱）
- §9：接口稳定优先（核心接口列表 + 统一响应格式）
- §10-13：模型接入、数据库设计、AI分析、安全与部署
- §14-15：注释与可读性、验收习惯
- §16：已接入 skills

移除/移出：
- §6-7：当前阶段做什么/不做什么 → 移到 docs/current-state.md
- §17-18：主计划书引用、当前状态详情 → 移到 docs/current-state.md
- §19：API Key 合规规则（精简为 2 行引用）
- §20-21：技术债务状态和进度同步规则 → 移到交接模板

### 2. 创建 docs/current-state.md
替代原 CLAUDE.md §6-7、§17-18-19-20，包含：
- 当前版本号（v2.3.1）
- 已完成 Phase 摘要（1-2 句话/Phase）
- 当前遗留问题（从计划书同步）
- 当前不做什么（从原 CLAUDE.md §7 提取）
- API Key 合规提醒

### 3. 创建 docs/ai-handoff.md（交接模板）
固定模板，每次交接控制在 80 行以内：
```
# AI 交接：{任务名称}
日期：
上一窗口完成：

## 本轮目标

## 相关文件

## 已知风险

## 验证方式

## 未完成项
```
在模板末尾附上进度同步检查清单（原 §21 的 3 步）。

### 4. 更新 CLAUDE.md 引用
- CLAUDE.md 头部增加引用：`> 当前版本状态见 docs/current-state.md`
- CLAUDE.md 末尾增加引用：`> 交接模板见 docs/ai-handoff.md`

## 禁止
- 不修改业务代码
- 不修改 docs/project-fullstack-plan.md
- 不删除 CLAUDE.md 中 §8-§15 的任何硬性约束

## 验收
- CLAUDE.md ≤ 250 行（`wc -l .claude/CLAUDE.md`）
- docs/current-state.md 存在且包含版本号和遗留问题
- docs/ai-handoff.md 存在且含固定模板
- 前端/后端 build 通过（确认未误删配置）
```
```

---

## 任务 7：修复 Vite 代理 SSE 缓冲（流式输出不生效） ✅

**优先级**：~~P1~~ → 已完成
**预计工作量**：~~1 个对话窗口~~ → 已执行完毕

### 完成记录

- vite.config.js 已为 `/api/chat/send` 端点配置 `proxyRes` 钩子，禁用压缩和缓冲
- 设置 `x-accel-buffering: no`、`cache-control: no-cache`、移除 `content-encoding`
- `src/api/client.ts` 中 `chatSend()` 死代码可后续清理（P4 跟进项）

### 原背景（备查）

**优先级**：P1（用户体验缺陷）
**预计工作量**：1 个对话窗口

### 背景

后端 `chat.service.ts` 已正确实现 SSE 流式输出（`res.writeHead` + `res.flushHeaders` + 逐 token `res.write`），
前端 `ClientChat.vue` 已正确使用 `fetch()` + `ReadableStream` reader 解析 SSE。
但 Vite 开发服务器代理默认缓冲响应，导致整段响应在 `res.end()` 后才一次性到达前端。

### 允许改动范围

- `vite.config.js`：为 `/api/chat/send` 端点添加代理配置，禁用缓冲
- 备选方案：前端在开发环境直连 NestJS 后端（绕过代理）
- 可选：清理 `client.ts` 中无用的 `chatSend()` Axios 封装（因为 Chat.vue 已用 fetch）

### 禁止触碰

- 不改后端 SSE 实现（已正确）
- 不改前端 SSE 解析逻辑（已正确）
- 不改其他代理规则

### 验收命令

```bash
# 启动前后端后在浏览器验证：
# 打开 AI 咨询页面 → 发送消息 → 观察 AI 回复是否逐字出现（而非一次性显示）
```

### 新窗口提示词

```
## 目标
修复 AI 咨询界面流式输出在开发环境不生效的问题。

## 根因
后端 SSE 实现正确（chat.service.ts 设置 text/event-stream + flushHeaders + 逐 token write），
前端 SSE 解析正确（ClientChat.vue 使用 fetch + ReadableStream reader）。
但 Vite 开发服务器的 http-proxy 默认缓冲代理响应，导致后端逐 token 写入的数据
在代理层被累积，等 res.end() 后才一次性转发给浏览器。

## 要求

### 方案一（推荐）：Vite 代理配置禁用缓冲
在 vite.config.js 的 `/api` 代理规则中增加配置：

```js
'/api': {
  target: apiTarget,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyRes', (proxyRes, req, res) => {
      // SSE 端点禁用压缩和缓冲
      if (req.url?.includes('/chat/send')) {
        // 移除可能触发缓冲的响应头
        delete proxyRes.headers['content-encoding'];
        // 确保 SSE 内容类型不被修改
        proxyRes.headers['cache-control'] = 'no-cache';
        proxyRes.headers['x-accel-buffering'] = 'no';
      }
    });
  },
},
```

### 方案二（备选）：绕过代理
如果方案一不生效（取决于 http-proxy 版本），让前端在开发环境直连后端：
- 在 .env.development 或 vite.config.js 中判断
- 聊天请求直接发到 `http://127.0.0.1:8000/api/chat/send`（不走代理）
- 注意：这需要后端 CORS 允许 5173 来源（已配置）

### 附加清理
`src/api/client.ts` 第 12-14 行的 `chatSend()` 函数使用 Axios（不支持 ReadableStream），
而 ClientChat.vue 实际用原生 fetch。这个函数是死代码，建议删除或加注释标记废弃。

## 禁止
- 不改后端 chat.service.ts 的 SSE 实现
- 不改前端 ClientChat.vue 的 SSE 解析逻辑
- 不改其他代理规则
- 不引入新依赖

## 验收
- 启动前后端
- 浏览器打开 http://localhost:5173/client/chat
- 发送消息，观察 AI 回复是否逐字出现（mock 模式下每字符 30ms 延迟）
- 确认"发送"按钮在 streaming 期间显示"思考中..."且 disabled
- 确认 streaming 结束后 sessionId 正确更新到侧边栏
```
```

---

## 执行顺序与依赖

```
任务 1 (目录统一)                                     — ✅ 已完成 (2026-05-11)
  ├─→ 任务 2 (文档收敛)                               — ✅ 已完成
  ├─→ 任务 3 (仓库卫生，可并行)                        — ✅ 已完成
  └─→ 任务 4 (Docker/脚本修正)                        — ✅ 已完成

任务 5 (产品安全边界)                                  — ✅ 已完成
任务 6 (CLAUDE.md 精简)                               — ✅ 已完成
任务 7 (Vite SSE 修复)                                — ✅ 已完成

所有 7 项治理任务已于 2026-05-11 全部完成并推送。
```

---

## 新发现待跟进事项

以下事项在验收任务 1-4 过程中发现，尚未在治理任务中覆盖：

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P2 | 前端构建 chunk 过大 | Dashboard 1.1MB、ArticleEditor 801KB，建议用动态导入拆分 |
| P3 | server/.env DeepSeek Key 轮换 | 当前 Key 曾在 `.claude/settings.json` 明文记录，虽已脱敏+忽略，建议生成新 Key |
| P3 | `.claude/settings.json` 权限记录清理 | 旧路径 `git -C ..` 条目已清理，但 taskkill 的 PID 为硬编码（不影响功能） |
| P4 | `src/api/client.ts` 死代码 `chatSend()` | ClientChat.vue 已用原生 fetch，Axios 封装的 `chatSend()` 可考虑删除 |

---

## 后续使用

1. 所有 7 项治理任务已完成，各任务提示词保留在文档中可作为参考
2. 新发现待跟进事项可纳入后续迭代计划
3. 如需新增治理任务，按相同格式（任务编号、优先级、背景、允许/禁止改动范围、验收命令）追加在末尾
