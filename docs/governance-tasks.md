# 项目治理任务拆解

> 基于 2026-05-11 仓库审查结果。全部 7 项治理任务已于 2026-05-11 完成。
>
> 已完成任务的详细提示词和原始背景已归档移除，如有需要可回滚 Git 查看。

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

## 待跟进任务

以下事项在验收过程中发现，尚未纳入治理任务。

---

### 待办 1：前端构建 chunk 过大 — 动态导入拆分

**优先级**：P2（性能体验）
**预计工作量**：1 个对话窗口

#### 背景

当前 `npm run build` 产出的 chunk 有 2 个过大文件：
- `Dashboard-lZ45Ynf2.js` — **1,118.55 kB**（gzip 后 366.78 kB）
- `ArticleEditor-bG2y9HRZ.js` — **801.42 kB**（gzip 后 274.36 kB）

Vite 构建警告：`Some chunks are larger than 500 kB after minification`。原因是大组件（Dashboard 的 ECharts、ArticleEditor 的富文本编辑器）被全量打包到单一 chunk 中。

#### 允许改动范围

- `src/views/Dashboard.vue`：对 ECharts 相关 import 加 `defineAsyncComponent` 或 dynamic import
- `src/components/ArticleEditor.vue`：对富文本编辑器组件做异步加载
- `src/router/index.js`：对 Dashboard 和 Knowledge 路由添加 `component: () => import(...)` 懒加载
- 可选：在 `vite.config.js` 中调整 `build.rollupOptions.output.manualChunks` 显式拆分 vendor

#### 禁止触碰

- 不修改业务逻辑
- 不修改后端代码
- 不修改 ECharts 或富文本编辑器的功能
- 不做无根据的"提前优化"（只动 build 警告指出的那 2 个 chunk）

#### 验收命令

```bash
npm run build 2>&1 | grep -E "chunk|larger than"
# 不应再出现 500 kB 以上 chunk 的警告
```

#### 新窗口提示词

```
## 目标
修复前端构建 chunk 过大警告。当前 Dashboard (1.1MB) 和 ArticleEditor (801KB) 的 chunk
超过 Vite 默认 500 kB 建议上限，需要做动态导入拆分。

## 当前问题
- Dashboard 全量打包了 ECharts，可改为路由级懒加载
- ArticleEditor 打包了富文本编辑器，可改为组件级异步加载
- 两个组件都不需要在首屏加载，适合 dynamic import

## 要求
1. 打开 src/router/index.js，将 Dashboard 路由改为：
   component: () => import('../views/Dashboard.vue')
2. 打开 src/views/Dashboard.vue，检查是否有直接 import ECharts，
   如有则改为按需 import 或动态加载
3. 打开 src/components/ArticleEditor.vue，将富文本编辑器改为异步：
   import { defineAsyncComponent } from 'vue'
  components: { Editor: defineAsyncComponent(() => import('...')) }
4. 运行 npm run build 验证
5. 如果路由懒加载还不够，在 vite.config.js 增加 manualChunks 配置

## 禁止
- 不修改业务逻辑
- 不改后端代码
- 不做无根据的提前优化

## 验收
- npm run build 不输出 "larger than 500 kB" 警告
- 页面功能正常（Dashboard 图表、ArticleEditor 编辑器可用）
```

---

### 待办 2：server/.env DeepSeek Key 轮换

**优先级**：P3（安全风险）
**预计工作量**：5 分钟

#### 背景

当前 `server/.env` 中的 `DEEPSEEK_API_KEY`（`sk-b58f3b...`）曾在 `.claude/settings.json` 中以明文命令记录形式存在（已脱敏为 `sk-********` 并加入 `.gitignore`）。虽然该 Key 未被提交到 Git 历史，但出于安全最佳实践，建议在 DeepSeek 后台生成新 Key 并替换。

关联 Key 位置：
- `server/.env` — 运行时读取
- `.claude/settings.json` — 已脱敏 + 被 `.gitignore` 覆盖

#### 允许改动范围

- 仅修改 `server/.env` 中的 `DEEPSEEK_API_KEY` 值
- 如 DeepSeek 后台支持，吊销旧 Key

#### 禁止触碰

- 不修改 `.env.example`
- 不修改任何代码
- 不提交 `.env` 到 Git

#### 验收命令

```bash
# 启动后端后验证新 Key 生效：
curl http://localhost:8000/api/chat/send -X POST -H "Content-Type: application/json" -d '{"message":"hello"}'
# 应返回正常 AI 回复而非 mock 回复
```

#### 新窗口提示词

```
## 目标
轮换 server/.env 中的 DeepSeek API Key。

## 原因
当前 Key 曾在 .claude/settings.json 中以明文命令形式记录（已被脱敏+忽略），
虽未提交到 Git，但建议立即轮换以消除泄露风险。

## 要求
1. 登录 DeepSeek 后台（https://platform.deepseek.com/api-keys）
2. 生成新的 API Key
3. 编辑 server/.env：
   DEEPSEEK_API_KEY=sk-新生成的key
4. 重启后端服务
5. 可选：吊销旧 Key（如 DeepSeek 后台支持）

## 禁止
- 不提交 .env 文件
- 不将新 Key 写入任何仓库文件

## 验收
- 启动后端后发送聊天消息，确认返回真实 AI 回复而非 mock 回复
```

---

### 待办 3：src/api/client.ts 死代码清理

**优先级**：P4（代码卫生）
**预计工作量**：1 个对话窗口

#### 背景

`src/api/client.ts` 第 12-14 行的 `chatSend()` 函数使用 Axios 封装，但 `ClientChat.vue` 实际使用原生 `fetch()` + `ReadableStream` reader 实现 SSE 流式解析。`chatSend()` 没有被任何组件引用，属于死代码。

#### 允许改动范围

- 删除 `src/api/client.ts` 中的 `chatSend()` 函数
- 如果该文件只剩死代码，可删除整个文件并清理 `src/api/admin.ts` 或调用侧中 `import { chatSend }` 的已存但废弃的引用

#### 禁止触碰

- 不修改 `ClientChat.vue` 的 SSE 解析逻辑
- 不修改 `admin.ts` 中的其他接口封装
- 不修改后端代码

#### 验收命令

```bash
grep -r "chatSend" src/  # 应无结果
grep -r "from.*client" src/views/ClientChat.vue  # 确认不再引用 client.ts
npm run build  # 构建通过
```

#### 新窗口提示词

```
## 目标
清理 src/api/client.ts 中的 chatSend() 死代码。

## 背景
ClientChat.vue 使用原生 fetch() + ReadableStream 解析 SSE 流，
不再使用 Axios 封装的 chatSend()。该函数在 client.ts 中定义
但全局搜索 chatSend 找不到任何调用方。

## 要求
1. 在 src/api/client.ts 中找到 chatSend() 函数（约第12-14行），确认未被引用
2. 如果整个文件无其他导出，删除整个文件
3. 如果文件还有其他有效导出，仅删除 chatSend() 函数体
4. 检查是否有 import { chatSend } from '../api/client' 的残余引用并清理
5. npm run build 确认构建通过

## 禁止
- 不修改 ClientChat.vue 的 SSE 逻辑
- 不修改后端
- 不修改 admin.ts 中的其他 API

## 验收
- grep -r "chatSend" src/ 无结果
- npm run build 通过
```

---

### 待办 4：.claude/settings.json 残留 PID 硬编码

**优先级**：P4（代码卫生）
**预计工作量**：1 个对话窗口

#### 背景

`.claude/settings.json` 目前仍有 4 条 taskkill 命令包含硬编码 PID（12044、40332），这些 PID 是之前某次开发会话中前端端口被占用时的残留。条目本身不影响功能，但硬编码 PID 在 settings.json 的权限列表中无实际意义。

#### 允许改动范围

- 移除 `taskkill` 相关的 4 条权限记录（第 13-17 行）
- 或在 PID 位置使用通配符（`*`）

#### 禁止触碰

- 不修改其他权限条目（`git`、`npx nest` 等保留）
- 不删除 `.claude/settings.json` 文件

#### 验收命令

```bash
grep -c "taskkill" .claude/settings.json  # 应为 0
```

#### 新窗口提示词

```
## 目标
清理 .claude/settings.json 中的硬编码 PID taskkill 命令。

## 当前问题
文件中有 4 行 taskkill 命令：
- "Bash(taskkill /F /PID 12044)"
- "Bash(taskkill /F /PID 40332)"
- "Bash(cmd.exe /c \"taskkill /F /PID 12044\")"
- "Bash(cmd.exe /c \"taskkill /F /PID 40332\")"

这些 PID 是之前端口被占用时遗留的，已无实际用途。

## 要求
1. 打开 .claude/settings.json
2. 删除 4 行 taskkill 相关的权限记录
3. 可选：如需要端口清理能力，保留一条通用模式 Bash(taskkill /F /PID *)

## 禁止
- 不删除 git、npx nest 等其他有用权限
- 不删除 settings.json 本身

## 验收
- grep "taskkill" .claude/settings.json 无结果
```

---

## 执行顺序

```
待办 1 (chunk 拆分) — P2，建议优先
待办 3 (死代码) — P4，可随时做
待办 4 (PID 清理) — P4，可随时做
待办 2 (Key 轮换) — P3，需手动操作 DeepSeek 后台
```

> 提示：待办 1 涉及构建产物变更，建议先做；待办 3 和 4 属代码卫生，可任选顺序；待办 2 需外部操作，可并行执行。
