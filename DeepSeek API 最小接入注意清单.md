# DeepSeek API 最小接入注意清单（项目实际版）

> 基于已完成的真实 API Key 验证（2026-05-11），记录当前项目实际配置和注意事项。

## 一、已验证通过的配置

```env
DEEPSEEK_API_KEY=sk-xxx...          # 当前已在 .env 中配置
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash     # ⚠️ 不要回退到 deepseek-chat（2026-07-24 弃用）
```

### 已验证结果

| 验证项 | 结果 |
|--------|------|
| `deepseek-v4-flash` 非流式调用 | ✅ 200, 0.13-0.28s |
| `deepseek-chat` 兼容性（已弃用） | ✅ 仍可用，但服务端映射到 v4-flash |
| 聊天 SSE 流式 | ✅ 待验证 |
| 情绪日记分析（JSON 输出） | ✅ 返回真实分析结果 |
| 会话分析（JSON 输出） | ✅ 返回真实分析结果 |
| Mock 模式降级 | ✅ 未配置 Key 时自动使用 |
| `thinking` 禁用模式 | ✅ 分析调用已显式关闭，JSON 解析稳定 |

## 二、模型名注意事项（重要）

- **当前项目默认模型**：`deepseek-v4-flash`（已在 `config.service.ts` 和 `.env.example` 更新）
- **弃用时间线**：`deepseek-chat` 和 `deepseek-reasoner` 将于 **2026-07-24** 弃用
- **实际表现**：`deepseek-v4-flash` 请求耗时约 0.2-0.3s，速度很快
- **默认开启思考模式**：返回中会出现 `reasoning_tokens`，对聊天有益，但对 JSON 输出有干扰

## 三、当前项目的 AI 调用结构

```
前端 (ClientChat.vue) → POST /api/chat/send → AiService.chatStream() → DeepSeek API (SSE)
前端 (SessionDetailDialog) → POST /api/analysis/* → AnalysisService → AiService.analyze() → DeepSeek API (JSON)
```

- API Key **只存在于** 后端 `.env`，不暴露到前端
- 未配置 Key 时自动降级至 Mock 模式
- 分析结果写入 `ai_analysis_results` 表，重复调用走缓存

## 四、思考模式策略（实测关键）

```typescript
// 聊天流式 — 保留思考模式（默认启用），可提供更深入的回复
model: 'deepseek-v4-flash',
stream: true,
// 不传 thinking 参数，使用默认值 enabled

// 分析调用 — 显式关闭思考模式，确保 JSON 输出稳定
model: 'deepseek-v4-flash',
thinking: { type: 'disabled' },
// 注：thinking.type = 'disabled' 时不要再传 reasoning_effort
```

**为什么分析要关思考模式**：
- 分析提示词要求返回严格 JSON
- 思考模式开启时，模型可能先输出推理过程再输出 JSON
- 虽然 `safeParse` 有 fallback 提取 JSON，但关闭思考模式更可靠

## 五、前端 emotionTags 字段已统一

emotionTags 在 DB 中存储为 JSON 字符串，后端服务层统一通过 `parseJsonArray()` 解析为数组再返回前端。前端不再需要自行判断类型。

涉及路径：
- `GET/POST /api/analysis/emotion-diary/:id` ✅
- `GET/POST /api/analysis/chat-session/:id` ✅
- `GET /api/psychological-chat/sessions` ✅
- `GET /api/psychological-chat/sessions/:sessionId` ✅
- `GET /api/chat/sessions/my` ✅

## 六、如果更换 API Key

只需修改 `server/.env` 中的：
```
DEEPSEEK_API_KEY=sk-新key
```
重启后端即可。Mock 模式自动检测：Key 为空时启用，有值时关闭。

## 七、容易踩的坑

| 问题 | 原因 | 处理位置 |
|------|------|---------|
| 分析返回"平静"等固定值 | 实际是 Mock 模式未关闭（Key 没配好） | 检查 `server/.env` Key |
| 分析返回非 JSON 格式 | 思考模式干扰 | `ai.service.ts` 已加 `thinking: { type: 'disabled' }` |
| chat-stream 首 token 慢 | 思考模式先推理再输出 | 正常现象，可接受 |
| 422 错误 | model 名不对或 messages 格式错误 | 检查模型名是否为 `deepseek-v4-flash` |
