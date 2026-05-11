import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrisma = {
    knowledgeArticle: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    chatSession: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    emotionDiary: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    aiAnalysisResult: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('应返回完整的概览统计数据', async () => {
      mockPrisma.knowledgeArticle.count.mockResolvedValueOnce(10); // articleCount
      mockPrisma.knowledgeArticle.count.mockResolvedValueOnce(8);  // publishedArticleCount
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.chatSession.count.mockResolvedValueOnce(20);      // sessionCount
      mockPrisma.chatSession.count.mockResolvedValueOnce(3);       // activeSessionCount
      mockPrisma.emotionDiary.count.mockResolvedValueOnce(50);     // diaryCount
      mockPrisma.emotionDiary.count.mockResolvedValueOnce(2);      // todayDiaryCount
      mockPrisma.aiAnalysisResult.count.mockResolvedValue(15);
      mockPrisma.aiAnalysisResult.groupBy.mockResolvedValue([
        { riskLevel: 'low', _count: 10 },
        { riskLevel: 'high', _count: 5 },
      ]);

      const result = await service.getOverview();
      expect(result.articleCount).toBe(10);
      expect(result.publishedArticleCount).toBe(8);
      expect(result.userCount).toBe(5);
      expect(result.sessionCount).toBe(20);
      expect(result.activeSessionCount).toBe(3);
      expect(result.diaryCount).toBe(50);
      expect(result.todayDiaryCount).toBe(2);
      expect(result.analysisCount).toBe(15);
      expect(result.riskDistribution).toHaveLength(2);
    });
  });

  describe('getTrends', () => {
    it('emotion 类型应返回月度情绪趋势', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue([
        { diaryDate: '2026-01-15', moodScore: 7 },
        { diaryDate: '2026-01-20', moodScore: 5 },
        { diaryDate: '2026-02-10', moodScore: 8 },
      ]);

      const result = await service.getTrends('emotion') as any[];
      expect(result).toHaveLength(2);
      expect(result[0].month).toBe('2026-01');
      expect(result[0].avgScore).toBe(6);
      expect(result[0].count).toBe(2);
      expect(result[1].month).toBe('2026-02');
    });

    it('session 类型应返回每日会话数', async () => {
      mockPrisma.chatSession.findMany.mockResolvedValue([
        { startTime: new Date('2026-01-15T10:00:00Z') },
        { startTime: new Date('2026-01-15T14:00:00Z') },
        { startTime: new Date('2026-01-16T09:00:00Z') },
      ]);

      const result = await service.getTrends('session') as any[];
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01-15');
      expect(result[0].count).toBe(2);
    });

    it('article 类型应返回累计发布数', async () => {
      mockPrisma.knowledgeArticle.findMany.mockResolvedValue([
        { publishedAt: new Date('2026-01-15') },
        { publishedAt: new Date('2026-01-15') },
        { publishedAt: new Date('2026-02-10') },
      ]);

      const result = await service.getTrends('article') as any[];
      expect(result).toHaveLength(2);
      expect(result[0].cumulativeCount).toBe(2);
      expect(result[1].cumulativeCount).toBe(3);
    });

    it('不支持的类型应抛 BadRequestException', async () => {
      await expect(service.getTrends('unknown')).rejects.toThrow(BadRequestException);
    });
  });
});
