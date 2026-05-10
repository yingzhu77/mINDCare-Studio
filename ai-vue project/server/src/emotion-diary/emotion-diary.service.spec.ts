import { Test, TestingModule } from '@nestjs/testing';
import { EmotionDiaryService } from './emotion-diary.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('EmotionDiaryService', () => {
  let service: EmotionDiaryService;

  const mockPrisma = {
    emotionDiary: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmotionDiaryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmotionDiaryService>(EmotionDiaryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      diaryDate: '2026-05-10',
      moodScore: 7,
      sleepQuality: 8,
      stressLevel: 3,
      dominantEmotion: '开心',
      emotionTriggers: '工作顺利',
      diaryContent: '今天心情不错',
    };

    it('应创建情绪日记', async () => {
      const diary = { id: 1, ...dto, userId: 1, userName: '小明' };
      mockPrisma.emotionDiary.create.mockResolvedValue(diary);

      const result = await service.create(dto, 1, '小明');
      expect(result).toEqual(diary);
      expect(mockPrisma.emotionDiary.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 1, userName: '小明' },
      });
    });
  });

  describe('update', () => {
    const diary = {
      id: 1,
      diaryDate: '2026-05-10',
      moodScore: 7,
      userId: 1,
    };

    const dto = { moodScore: 8, diaryContent: '更新后的内容' };

    it('所有者应能更新日记', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.emotionDiary.update.mockResolvedValue({ ...diary, ...dto });

      const result = await service.update(1, dto, 1);
      expect(result.moodScore).toBe(8);
    });

    it('日记不存在应抛 NotFoundException', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(null);
      await expect(service.update(999, dto, 1)).rejects.toThrow(NotFoundException);
    });

    it('非所有者更新应抛 ForbiddenException', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      await expect(service.update(1, dto, 999)).rejects.toThrow(ForbiddenException);
    });

    it('管理端更新（不传 userId）不应校验所有权', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.emotionDiary.update.mockResolvedValue({ ...diary, ...dto });

      const result = await service.update(1, dto);
      expect(result.moodScore).toBe(8);
    });
  });

  describe('adminPage', () => {
    const records = [
      {
        id: 1,
        userId: 1,
        userName: '小明',
        diaryDate: '2026-05-10',
        moodScore: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, username: 'xiaoming' },
        analyses: [],
      },
    ];

    it('应分页返回所有日记', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue(records);
      mockPrisma.emotionDiary.count.mockResolvedValue(1);

      const result = await service.adminPage({ currentPage: 1, size: 10 });
      expect(result.total).toBe(1);
      expect(result.records).toHaveLength(1);
    });

    it('应支持按 dominantEmotion 筛选', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue([]);
      mockPrisma.emotionDiary.count.mockResolvedValue(0);

      await service.adminPage({ currentPage: 1, size: 10 }, { dominantEmotion: '开心' });
      const args = mockPrisma.emotionDiary.findMany.mock.calls[0][0];
      expect(args.where.dominantEmotion).toBe('开心');
    });

    it('应支持 moodScore 范围筛选', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue([]);
      mockPrisma.emotionDiary.count.mockResolvedValue(0);

      await service.adminPage({ currentPage: 1, size: 10 }, { minMoodScore: 5, maxMoodScore: 8 });
      const args = mockPrisma.emotionDiary.findMany.mock.calls[0][0];
      expect(args.where.moodScore.gte).toBe(5);
      expect(args.where.moodScore.lte).toBe(8);
    });
  });

  describe('adminDelete', () => {
    const diary = { id: 1, userId: 1 };

    it('应删除指定日记', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(diary);
      mockPrisma.emotionDiary.delete.mockResolvedValue(diary);

      const result = await service.adminDelete(1);
      expect(result).toEqual(diary);
    });

    it('日记不存在应抛 NotFoundException', async () => {
      mockPrisma.emotionDiary.findUnique.mockResolvedValue(null);
      await expect(service.adminDelete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('myPage', () => {
    const records = [
      {
        id: 1,
        userId: 1,
        userName: '小明',
        diaryDate: '2026-05-10',
        moodScore: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        analyses: [],
      },
    ];

    it('应返回当前用户的日记', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue(records);
      mockPrisma.emotionDiary.count.mockResolvedValue(1);

      const result = await service.myPage({ currentPage: 1, size: 10 }, 1);
      expect(result.total).toBe(1);
      const args = mockPrisma.emotionDiary.findMany.mock.calls[0][0];
      expect(args.where.userId).toBe(1);
    });

    it('应支持按日记日期筛选', async () => {
      mockPrisma.emotionDiary.findMany.mockResolvedValue([]);
      mockPrisma.emotionDiary.count.mockResolvedValue(0);

      await service.myPage({ currentPage: 1, size: 10 }, 1, { diaryDate: '2026-05-10' });
      const args = mockPrisma.emotionDiary.findMany.mock.calls[0][0];
      expect(args.where.diaryDate).toBe('2026-05-10');
    });
  });
});
