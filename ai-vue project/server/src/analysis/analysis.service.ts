import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { parseJsonArray } from '../common/utils/json-helper';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * 触发情绪日记 AI 分析
   */
  async analyzeEmotionDiary(diaryId: number) {
    const diary = await this.prisma.emotionDiary.findUnique({ where: { id: diaryId } });
    if (!diary) throw new NotFoundException('情绪日记不存在');

    // 检查是否已有分析结果
    const existing = await this.prisma.aiAnalysisResult.findFirst({
      where: { bizType: 'emotion_diary', bizId: diaryId, status: 'success' },
    });
    if (existing) return { ...existing, emotionTags: parseJsonArray(existing.emotionTags) };

    const prompt = this.buildDiaryPrompt();
    const input = JSON.stringify({
      diaryContent: diary.diaryContent,
      moodScore: diary.moodScore,
      sleepQuality: diary.sleepQuality,
      stressLevel: diary.stressLevel,
      dominantEmotion: diary.dominantEmotion,
      emotionTriggers: diary.emotionTriggers,
    });

    try {
      const raw = await this.aiService.analyze(prompt, input);
      const parsed = this.safeParse(raw);

      const result = await this.prisma.aiAnalysisResult.create({
        data: {
          bizType: 'emotion_diary',
          bizId: diaryId,
          userId: diary.userId,
          emotionDiaryId: diaryId,
          mainEmotion: parsed.mainEmotion,
          emotionIntensity: parsed.emotionIntensity,
          emotionNature: parsed.emotionNature,
          riskLevel: parsed.riskLevel,
          riskDescription: parsed.riskDescription,
          professionalAdvice: parsed.professionalAdvice,
          improvementSuggestions: parsed.improvementSuggestions,
          emotionTags: JSON.stringify(parsed.emotionTags),
          modelName: parsed.modelName,
          rawResponse: raw,
          status: 'success',
        },
      });
      return { ...result, emotionTags: parseJsonArray(result.emotionTags) };
    } catch (error) {
      return this.prisma.aiAnalysisResult.create({
        data: {
          bizType: 'emotion_diary',
          bizId: diaryId,
          userId: diary.userId,
          emotionDiaryId: diaryId,
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * 触发会话 AI 分析
   */
  async analyzeChatSession(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    const existing = await this.prisma.aiAnalysisResult.findFirst({
      where: { bizType: 'chat_session', chatSessionId: session.id, status: 'success' },
    });
    if (existing) return { ...existing, emotionTags: parseJsonArray(existing.emotionTags) };

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { messageTime: 'asc' },
    });

    const prompt = this.buildSessionPrompt();
    const input = JSON.stringify(
      messages.map((m) => ({ role: m.role, content: m.content })),
    );

    try {
      const raw = await this.aiService.analyze(prompt, input);
      const parsed = this.safeParse(raw);

      return this.prisma.$transaction(async (tx) => {
        // 回写会话摘要
        await tx.chatSession.update({
          where: { sessionId },
          data: {
            emotionTags: JSON.stringify(parsed.emotionTags),
            aiSummary: parsed.summary,
            riskLevel: parsed.riskLevel,
          },
        });

        const result = await tx.aiAnalysisResult.create({
          data: {
            bizType: 'chat_session',
            bizId: session.id,
            userId: session.userId,
            chatSessionId: session.id,
            summary: parsed.summary,
            emotionTags: JSON.stringify(parsed.emotionTags),
            riskLevel: parsed.riskLevel,
            riskDescription: parsed.riskDescription,
            professionalAdvice: parsed.professionalAdvice,
            improvementSuggestions: parsed.improvementSuggestions,
            modelName: parsed.modelName,
            rawResponse: raw,
            status: 'success',
          },
        });
        return { ...result, emotionTags: parseJsonArray(result.emotionTags) };
      });
    } catch (error) {
      return this.prisma.aiAnalysisResult.create({
        data: {
          bizType: 'chat_session',
          bizId: session.id,
          userId: session.userId,
          chatSessionId: session.id,
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  // ================== 查询分析结果 ==================

  async getEmotionDiaryAnalysis(diaryId: number) {
    const result = await this.prisma.aiAnalysisResult.findFirst({
      where: { bizType: 'emotion_diary', bizId: diaryId },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) return null;
    return { ...result, emotionTags: parseJsonArray(result.emotionTags) };
  }

  async getChatSessionAnalysis(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    const result = await this.prisma.aiAnalysisResult.findFirst({
      where: { bizType: 'chat_session', bizId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) return null;
    return { ...result, emotionTags: parseJsonArray(result.emotionTags) };
  }

  private buildDiaryPrompt(): string {
    return `你是一位专业的心理健康分析助手。请分析以下情绪日记内容，并以 JSON 格式返回结果。

输出格式（严格JSON）：
{
  "mainEmotion": "主要情绪（中文）",
  "emotionIntensity": 1-10 数字,
  "emotionNature": "positive" | "negative" | "neutral",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskDescription": "风险描述",
  "professionalAdvice": "专业建议",
  "improvementSuggestions": "改善建议",
  "emotionTags": ["标签1", "标签2"],
  "modelName": "deepseek-v4-flash"
}

注意：
1. 不做医疗诊断。
2. 如果检测到高风险（自伤、自杀意图），标记为 critical 并在建议中强调寻求专业帮助。
3. 用中文输出。`;
  }

  private buildSessionPrompt(): string {
    return `你是一位专业的心理咨询督导。请分析以下会话记录，并以 JSON 格式返回结果。

输出格式（严格JSON）：
{
  "summary": "会话摘要（200字以内）",
  "emotionTags": ["标签1", "标签2"],
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskDescription": "风险描述（如有风险）",
  "professionalAdvice": "给咨询师的督导建议",
  "improvementSuggestions": "给用户的后续建议",
  "modelName": "deepseek-v4-flash"
}

注意：
1. 不做医疗诊断。
2. 如果检测到高风险内容，标记为 critical。
3. 用中文输出。`;
  }

  private safeParse(raw: string): any {
    try {
      // 尝试直接解析 JSON
      return JSON.parse(raw);
    } catch {
      // 尝试提取 JSON 块
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          // fallback
        }
      }

      return {
        mainEmotion: '未知',
        emotionIntensity: 0,
        emotionNature: 'neutral',
        riskLevel: 'low',
        riskDescription: '无法解析分析结果',
        professionalAdvice: '',
        improvementSuggestions: '',
        summary: raw.slice(0, 200),
        emotionTags: [],
        modelName: '',
      };
    }
  }
}
