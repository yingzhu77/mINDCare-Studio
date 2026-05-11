import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

describe('AnalysisService', () => {
  let service: AnalysisService;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    emotionDiary: {
      findUnique: jest.fn(),
    },
    chatSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      findMany: jest.fn(),
    },
    aiAnalysisResult: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAiService = {
    analyze: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeEmotionDiary', () => {
    const diaryId = 1;
    const diary = {
      id: diaryId,
      userId: 1,
      diaryContent: '今天心情不错',
      moodScore: 7,
      sleepQuality: 8,
      stressLevel: 3,
      dominantEmotion: '开心',
      emotionTriggers: '工作顺利',
      diaryDate: '2026-05-10',
      userName: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockAiResult = JSON.stringify({
      mainEmotion: '开心',
      emotionIntensity: 6,
      emotionNature: 'positive',
      riskLevel: 'low',
      riskDescription: '无明显风险',
      professionalAdvice: '保持积极心态',
      improvementSuggestions: '多与朋友交流',
      emotionTags: ['开心', '积极'],
      modelName: 'deepseek-v4-flash',
    });

    it('应分析情绪日记并保存结果', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(null);
      mockAiService.analyze.mockResolvedValue(mockAiResult);
      const savedResult = {
        id: 1,
        bizType: 'emotion_diary',
        bizId: diaryId,
        status: 'success',
        mainEmotion: '开心',
        emotionTags: null,
      };
      mockPrisma.aiAnalysisResult.create.mockResolvedValue(savedResult);

      const result = await service.analyzeEmotionDiary(diaryId);
      expect(result).toEqual({ ...savedResult, emotionTags: [] });
      expect(mockAiService.analyze).toHaveBeenCalled();
    });

    it('日记不存在应抛出 NotFoundException', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(null);
      await expect(service.analyzeEmotionDiary(diaryId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('已有分析结果应直接返回缓存', async () => {
      const cached = {
        id: 1,
        bizType: 'emotion_diary',
        bizId: diaryId,
        status: 'success',
        mainEmotion: '开心',
        emotionTags: null,
      };
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(cached);

      const result = await service.analyzeEmotionDiary(diaryId);
      expect(result).toEqual({ ...cached, emotionTags: [] });
      expect(mockAiService.analyze).not.toHaveBeenCalled();
    });

    it('AI 调用失败应保存 failed 状态不抛出异常', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(null);
      mockAiService.analyze.mockRejectedValue(new Error('API error'));

      const failedResult = {
        id: 2,
        bizType: 'emotion_diary',
        bizId: diaryId,
        status: 'failed',
        errorMessage: 'API error',
      };
      mockPrisma.aiAnalysisResult.create.mockResolvedValue(failedResult);

      const result = await service.analyzeEmotionDiary(diaryId);
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('API error');
    });
  });

  describe('analyzeChatSession', () => {
    const sessionId = 'session-1';
    const session = { id: 1, sessionId, userId: 1, startTime: new Date(), endTime: new Date(), messageCount: 0, status: 'active', createdAt: new Date(), updatedAt: new Date(), userName: 'testuser', emotionTags: null, aiSummary: null, riskLevel: null };
    const messages = [
      { id: 1, sessionId, role: 'user', content: '你好', messageTime: new Date(), createdAt: new Date(), rawPayload: null },
      { id: 2, sessionId, role: 'assistant', content: '你好，有什么可以帮助你的？', messageTime: new Date(), createdAt: new Date(), rawPayload: null },
    ];
    const mockAiResult = JSON.stringify({
      summary: '用户进行了日常对话',
      emotionTags: ['平静'],
      riskLevel: 'low',
      riskDescription: '无风险',
      professionalAdvice: '继续保持',
      improvementSuggestions: '多尝试户外活动',
      modelName: 'deepseek-v4-flash',
    });

    it('应分析会话并保存结果', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(null);
      mockPrisma.chatMessage.findMany.mockResolvedValue(messages);
      mockAiService.analyze.mockResolvedValue(mockAiResult);

      const savedResult = {
        id: 1,
        bizType: 'chat_session',
        bizId: session.id,
        status: 'success',
        summary: '用户进行了日常对话',
        emotionTags: null,
      };
      mockPrisma.aiAnalysisResult.create.mockResolvedValue(savedResult);
      mockPrisma.chatSession.update.mockResolvedValue(session);

      const result = await service.analyzeChatSession(sessionId);
      expect(result).toEqual({ ...savedResult, emotionTags: [] });
      expect(mockAiService.analyze).toHaveBeenCalled();
      expect(mockPrisma.chatSession.update).toHaveBeenCalled();
    });

    it('会话不存在应抛出 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(service.analyzeChatSession(sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('AI 调用失败应保存 failed 状态', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(null);
      mockPrisma.chatMessage.findMany.mockResolvedValue(messages);
      mockAiService.analyze.mockRejectedValue(new Error('API timeout'));

      const failedResult = {
        id: 2,
        bizType: 'chat_session',
        bizId: session.id,
        status: 'failed',
        errorMessage: 'API timeout',
      };
      mockPrisma.aiAnalysisResult.create.mockResolvedValue(failedResult);

      const result = await service.analyzeChatSession(sessionId);
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('API timeout');
    });
  });

  describe('getEmotionDiaryAnalysis', () => {
    it('应查询情绪日记分析结果', async () => {
      const result = { id: 1, bizType: 'emotion_diary', bizId: 1, status: 'success', emotionTags: null };
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(result);

      const res = await service.getEmotionDiaryAnalysis(1);
      expect(res).toEqual({ ...result, emotionTags: [] });
      expect(mockPrisma.aiAnalysisResult.findFirst).toHaveBeenCalledWith({
        where: { bizType: 'emotion_diary', bizId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getChatSessionAnalysis', () => {
    const sessionId = 'session-1';
    const session = { id: 1, sessionId, userId: 1, startTime: new Date(), endTime: new Date(), messageCount: 0, status: 'active', createdAt: new Date(), updatedAt: new Date(), userName: 'testuser', emotionTags: null, aiSummary: null, riskLevel: null };

    it('应查询会话分析结果', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      const result = { id: 1, bizType: 'chat_session', bizId: 1, status: 'success', emotionTags: null };
      mockPrisma.aiAnalysisResult.findFirst.mockResolvedValue(result);

      const res = await service.getChatSessionAnalysis(sessionId);
      expect(res).toEqual({ ...result, emotionTags: [] });
    });

    it('会话不存在应抛出 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(service.getChatSessionAnalysis(sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
