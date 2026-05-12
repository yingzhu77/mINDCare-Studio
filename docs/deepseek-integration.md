# DeepSeek API 接入文档

> 本文档基于 `server/src/ai/ai.service.ts`、`server/src/analysis/analysis.service.ts`、`server/src/config/config.service.ts` 的当前实现编写。

## 一、环境配置

### 获取 API Key

1. 注册 [DeepSeek 开放平台](https://platform.deepseek.com)
2. 在控制台创建 API Key，复制 `sk-...` 格式的密钥
3. 将模板文件复制为实际配置文件：

```bash
cp server/.env.example server/.env
```

4. 编辑 `server/.env`，填入 API Key：

```env
DEEPSEEK_API_KEY=sk-你的真实密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

### 配置项说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEEPSEEK_API_KEY` | 空 | API 密钥。**留空时自动启用 Mock 模式** |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | API 基础地址，私有化部署时修改 |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | 模型名 |

> 修改配置后**重启后端**即可生效，无需其它步骤。

### 危机热线配置（可选）

可在 `.env` 中配置危机热线的显示名称和号码：

```env
CRISIS_HOTLINE=400-161-9995
CRISIS_HOTLINE_NAME=全国心理援助热线
```

未配置时使用默认值 `400-161-9995` / `全国心理援助热线`。

## 二、模型选择

| 模型名 | 状态 | 建议 |
|--------|------|------|
| `deepseek-v4-flash` | ✅ 当前默认 | **推荐**。速度 0.2-0.3s，支持思考模式 |
| `deepseek-chat` | ⚠️ 2026-07-24 弃用 | 服务端已映射到 v4-flash，不推荐新项目使用 |

配置参考：`config.service.ts:54-56`

```typescript
get deepseekModel(): string {
  return process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
}
```

### 模型行为差异

- **聊天流式**：保留思考模式（默认启用），可提供更深入的回复，首次 token 因推理过程略慢
- **非流式分析**：显式关闭思考模式（`thinking: { type: 'disabled' }`），确保 JSON 输出稳定

## 三、调用方式

### 完整链路

```
前端 (Vue) → POST /api/chat/send → NestJS AiService → DeepSeek API
前端 (Vue) → POST /api/analysis/* → AnalysisService → AiService.analyze() → DeepSeek API
```

API Key **只存在于**后端 `.env` 中，前端无法直接调用模型 API。

### 流式聊天（chat/send）

消息经 `AiService.chatStream()` 发送，以 SSE（Server-Sent Events）方式逐 token 推送到前端。

```typescript
// ai.service.ts:54-63 — 流式请求体
const body = {
  model: this.config.deepseekModel,       // deepseek-v4-flash
  messages: [systemPrompt, ...userMessages],
  stream: true,                            // 启用 SSE
  temperature: 0.7,
  max_tokens: 2048,
};
```

- 适合对话场景，需要实时展示回复内容
- 响应中可能出现 `reasoning_tokens`（思考过程），对聊天有益
- API 调用失败时自动降级到 Mock 流式

### 非流式分析

分析请求通过 `AiService.analyze()` 发送，返回完整的 JSON 字符串。

```typescript
// ai.service.ts:132-141 — 分析请求体
const body = {
  model: this.config.deepseekModel,
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: inputData },
  ],
  temperature: 0.3,                        // 较低温度，输出更稳定
  max_tokens: 1024,
  thinking: { type: 'disabled' },          // 关闭思考模式，确保 JSON 稳定
};
```

- 适合情绪日记分析和会话摘要
- `thinking: { type: 'disabled' }` 防止模型在 JSON 前输出推理过程
- 不使用 `reasoning_effort` 参数（与 `thinking: disabled` 冲突）

## 四、Mock 模式

未配置 `DEEPSEEK_API_KEY` 时自动降级，无需任何额外配置。

### 检测逻辑

```typescript
// config.service.ts:58-60
get isMockAi(): boolean {
  return !this.deepseekApiKey;
}
```

### Mock 行为

| 场景 | Mock 行为 | 代码位置 |
|------|-----------|----------|
| 流式聊天 | 逐字输出预设的 9 句回复，每字间隔 30ms | `ai.service.ts:186-204` |
| 非流式分析 | 返回固定 JSON：情绪为"平静"、风险为"low" | `ai.service.ts:217-230` |
| 危机检测 | 命中关键词时优先输出热线资源 | `ai.service.ts:20-36` |

### Mock 模式识别

判断当前是 Mock 还是真实模式：

- 分析返回"平静"等固定值 → Mock 模式活跃（Key 未配置或配置有误）
- 分析返回多样化的分析结果 → 真实模式

## 五、AI 分析流程

### 情绪日记分析

```
触发 ──→ GET/POST /api/analysis/emotion-diary/:id
            │
            ├─ 查询日记记录
            ├─ 检查是否已有分析结果（缓存命中则直接返回）
            ├─ 调用 AiService.analyze()
            │     ├─ 输入：diaryContent, moodScore, sleepQuality, stressLevel, dominantEmotion, emotionTriggers
            │     └─ 输出：JSON（mainEmotion, emotionIntensity, emotionNature, riskLevel, ...）
            ├─ safeParse() 容错解析
            └─ 写入 ai_analysis_results 表（成功/失败均落库）
```

### 咨询会话分析

```
触发 ──→ GET/POST /api/analysis/chat-session/:sessionId
            │
            ├─ 查询会话 + 消息列表
            ├─ 检查是否已有分析结果（缓存命中则直接返回）
            ├─ 调用 AiService.analyze()
            │     ├─ 输入：消息列表（role + content 数组）
            │     └─ 输出：JSON（summary, emotionTags, riskLevel, ...）
            ├─ safeParse() 容错解析
            ├─ 回写 chatSession.emotionTags / aiSummary / riskLevel
            └─ 写入 ai_analysis_results 表
```

### 缓存策略

- 同一 `bizType` + `bizId` 下有 `status: 'success'` 的记录时，直接返回已有结果
- 不会重复调用模型 API
- 如需重新分析，需手动删除 `ai_analysis_results` 表中对应记录

### 容错机制

```typescript
// analysis.service.ts:209-237 — safeParse 三级降级
1. 直接 JSON.parse()
2. 提取首个 {} 块再解析
3. 返回默认结构（mainEmotion: "未知"，riskLevel: "low"）
```

模型调用失败时不阻塞核心业务，返回友好 fallback。

## 六、故障排查

### 401 认证失败

```
[AiService] ERROR: DeepSeek API error: 401 Unauthorized
```

**排查：**
1. 确认 `DEEPSEEK_API_KEY` 已在 `server/.env` 中正确配置
2. 密钥格式应为 `sk-...`（不含引号）
3. 确认 Key 在 DeepSeek 平台未过期或被删除
4. 检查 Base URL 是否正确（默认 `https://api.deepseek.com`）

### 超时 / 网络错误

```
[AiService] ERROR: AI call failed: Network error
```

**排查：**
1. 检查服务器是否能访问外网
2. 确认防火墙未屏蔽 `api.deepseek.com` 的出站连接
3. 尝试 `curl https://api.deepseek.com/v1/chat/completions -H "Authorization: Bearer YOUR_KEY"` 测试连通性

### 限流（429 / RateLimitError）

```
[AiService] ERROR: DeepSeek API error: 429 Too Many Requests
```

**排查：**
1. DeepSeek API 有调用频率限制，短时间内请求过多触发
2. 检查是否循环调用了分析接口
3. 适当的 `safeParse` fallback 和缓存机制可以减少重复请求
4. 日志中的 429 不一定导致前端失败 — 后端会自动降级返回 Mock 结果

### 无效模型名（422）

```
DeepSeek API 返回 422，错误信息含 "model" 相关
```

**排查：**
1. 确认 `DEEPSEEK_MODEL` 是否为有效值
2. 当前仅使用 `deepseek-v4-flash`
3. 检查模型名是否拼写正确（注意大小写和下划线）

## 七、安全注意事项

1. **API Key 只放后端**：`DEEPSEEK_API_KEY` 只能存在于 `server/.env`，绝不提交到前端代码或 Git 仓库
2. **提交规范**：`.env` 已在 `.gitignore` 中排除，只提交 `.env.example`
3. **Mock 模式兜底**：未配置 Key 时自动使用模拟数据，clone 即用
4. **分析结果落库**：AI 返回的分析结果写入 `ai_analysis_results` 表，前端只读数据库结果，不直接调用模型
5. **失败不阻塞**：模型调用失败时降级返回模拟结果，不影响核心业务流程

## 八、代码参考

| 文件 | 说明 |
|------|------|
| `server/src/ai/ai.service.ts` | DeepSeek API 调用核心（流式 + 非流式）、Mock 模式、危机检测 |
| `server/src/ai/ai.module.ts` | AI 模块声明 |
| `server/src/analysis/analysis.service.ts` | 分析业务逻辑（情绪日记 + 会话摘要）、缓存检查、容错 |
| `server/src/config/config.service.ts` | 环境变量读取（`DEEPSEEK_*`、`CRISIS_*`） |
| `server/.env.example` | 配置模板 |
