# 项目治理任务拆解（归档）

> 全部 7 项治理任务 + 3 项待办已于 2026-05-11 完成。
> 详细提示词和原始背景已归档移除，如有需要可回滚 Git 查看。

## 完成记录

| 任务 | 完成日期 | 说明 |
|------|---------|------|
| 任务 1：仓库目录结构统一 | 2026-05-11 | `ai-vue project/` → 根目录，提交 `b441a77` |
| 任务 2：文档收敛 | 2026-05-11 | 版本号统一 v2.3.1 |
| 任务 3：仓库卫生与安全底线 | 2026-05-11 | .gitignore 完善，API Key 脱敏 |
| 任务 4：Docker 与脚本路径修正 | 2026-05-11 | docker compose config 通过 |
| 任务 5：AI 产品安全边界 | 2026-05-11 | 免责声明 + 危机热线 + 高危关键词检测 |
| 任务 6：CLAUDE.md 精简 + 交接模板 | 2026-05-11 | CLAUDE.md < 250 行 + ai-handoff.md |
| 任务 7：Vite 代理 SSE 缓冲修复 | 2026-05-11 | vite.config.js proxyRes 钩子 |
| 待办 3：chatSend 死代码清理 | 2026-05-11 | 代码中已不存在 chatSend |
| 待办 4：settings.json PID 清理 | 2026-05-11 | 4 条 taskkill 硬编码已删除 |
| 待办 1：前端 chunk 拆分 | 2026-05-11 | 路由懒加载 + ArticleEditor 异步 + manualChunks |
| 待办 2：DeepSeek Key 轮换 | 2026-05-11 | 用户手动操作完成 |

---

> ✅ 全部治理任务已完成。后续优化方向见项目主讨论。

## 未完成待办

### 待办 1：前端构建 chunk 过大 — 动态导入拆分

**优先级**：P2（性能体验）
**预计工作量**：1 个对话窗口

`npm run build` 产出 2 个过大 chunk：
- Dashboard: **~1.1 MB**（ECharts 全量打包）
- ArticleEditor: **~800 kB**（富文本编辑器全量打包）

#### 方案
- `src/router/index.js`：Dashboard 路由改为 `() => import()` 懒加载
- `src/components/ArticleEditor.vue`：富文本编辑器改用 `defineAsyncComponent` 异步加载
- 可选：`vite.config.js` 增加 `manualChunks` 显式拆分 vendor

#### 验收
```bash
npm run build 2>&1 | grep -E "chunk|larger than"
# 不应出现 500 kB 以上 chunk 警告
```

---

### 待办 2：server/.env DeepSeek Key 轮换

**优先级**：P3（安全风险）
**预计工作量**：5 分钟

当前 Key（`sk-b58f3b...`）曾在 `.claude/settings.json` 中以明文命令形式出现（已脱敏 + gitignore）。虽未提交 Git，建议轮换。

#### 方案
1. 登录 [DeepSeek 后台](https://platform.deepseek.com/api-keys) 生成新 Key
2. 替换 `server/.env` 中的 `DEEPSEEK_API_KEY`
3. 可选：吊销旧 Key

#### 验收
```bash
curl http://localhost:8000/api/chat/send -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
# 应返回真实 AI 回复而非 mock
```
