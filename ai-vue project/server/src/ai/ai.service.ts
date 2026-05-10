import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * 流式聊天 — 调用 DeepSeek API 或在 mock 模式下返回预设内容
   */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    if (this.config.isMockAi) {
      yield* this.mockStream();
      return;
    }

    const systemPrompt = this.buildSystemPrompt();
    const body = {
      model: this.config.deepseekModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    };

    try {
      const response = await fetch(`${this.config.deepseekBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.deepseekApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok || !response.body) {
        this.logger.error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        yield* this.mockStream();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    } catch (error) {
      this.logger.error(`AI call failed: ${error.message}`);
      yield* this.mockStream();
    }
  }

  /**
   * 非流式分析调用 — 用于情绪分析和会话摘要
   */
  async analyze(prompt: string, content: string): Promise<string> {
    if (this.config.isMockAi) {
      return this.mockAnalyze(content);
    }

    const body = {
      model: this.config.deepseekModel,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
    };

    try {
      const response = await fetch(`${this.config.deepseekBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.deepseekApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`AI analyze failed: ${error.message}`);
      return this.mockAnalyze(content);
    }
  }

  // ================== 系统提示词 ==================

  private buildSystemPrompt(): string {
    return `你是一位专业的 AI 心理健康支持助手。请遵循以下原则：

1. 不做医疗诊断、不提供处方和治疗方案。
2. 对自伤、自杀等高风险内容，给出寻求专业帮助和紧急服务的建议。
3. 回复保持温和、共情、克制。
4. 可以引导用户思考，但不替代专业心理咨询师。
5. 如果用户表现出紧急风险，优先建议拨打心理援助热线。

请以中文回复。`;
  }

  // ================== Mock 模式 ==================

  private async *mockStream(): AsyncGenerator<string> {
    const phrases = [
      '你好！',
      '我是 AI 心理健康助手，',
      '很高兴能和你交流。',
      '请随时分享你的想法和感受，',
      '我会尽力提供支持和倾听。',
      '请记住，我只是一个 AI 助手，',
      '不能替代专业的心理咨询。',
      '如果你感到需要专业帮助，',
      '我会鼓励你寻求心理咨询师或相关服务。',
    ];

    for (const phrase of phrases) {
      for (const char of phrase) {
        yield char;
        await new Promise((r) => setTimeout(r, 30));
      }
    }
  }

  private mockAnalyze(content: string): string {
    const demo = {
      mainEmotion: '平静',
      emotionIntensity: 3,
      emotionNature: 'neutral',
      riskLevel: 'low',
      riskDescription: '当前内容未检测到明显风险',
      professionalAdvice: '保持规律作息，适当记录每日心情变化',
      improvementSuggestions: '可尝试每天花10分钟进行正念呼吸练习',
      summary: '用户记录了一次日常情绪状态，整体情绪较为平稳',
      emotionTags: ['平静', '日常'],
    };

    return JSON.stringify(demo);
  }
}
