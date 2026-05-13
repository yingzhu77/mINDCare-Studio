import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateDiaryDto, UpdateDiaryDto } from './dto/diary.dto';

export interface EmotionStatistics {
  overview: {
    totalCount: number;
    thisMonthCount: number;
    averageMoodScore: number | null;
    averageSleepQuality: number | null;
    averageStressLevel: number | null;
  };
  moodTrend: Array<{ month: string; avgScore: number; count: number }>;
  emotionDistribution: Array<{ emotion: string; count: number }>;
  stressSleepData: Array<{ date: string; stressLevel: number; sleepQuality: number }>;
  triggerAnalysis: Array<{ trigger: string; count: number }>;
}

@Injectable()
export class EmotionDiaryService {
  constructor(private readonly prisma: PrismaService) {}

  // ================== 管理端 ==================

  async adminPage(dto: PaginationDto, params?: {
    userName?: string;
    diaryDate?: string;
    dominantEmotion?: string;
    minMoodScore?: number;
    maxMoodScore?: number;
  }) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = {};

    if (params?.userName) {
      where.userName = { contains: params.userName };
    }
    if (params?.diaryDate) {
      where.diaryDate = params.diaryDate;
    }
    if (params?.dominantEmotion) {
      where.dominantEmotion = params.dominantEmotion;
    }
    if (params?.minMoodScore !== undefined || params?.maxMoodScore !== undefined) {
      where.moodScore = {};
      if (params.minMoodScore !== undefined) {
        where.moodScore.gte = params.minMoodScore;
      }
      if (params.maxMoodScore !== undefined) {
        where.moodScore.lte = params.maxMoodScore;
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.emotionDiary.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          analyses: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emotionDiary.count({ where }),
    ]);

    return { records, total, currentPage, size };
  }

  async adminDelete(id: number) {
    await this.getDiaryOrFail(id);
    return this.prisma.emotionDiary.delete({ where: { id } });
  }

  // ================== 用户端 ==================

  async create(dto: CreateDiaryDto, userId: number, userName: string) {
    return this.prisma.emotionDiary.create({
      data: { ...dto, userId, userName },
    });
  }

  async update(id: number, dto: UpdateDiaryDto, userId?: number) {
    const diary = await this.getDiaryOrFail(id);
    // 用户端更新需校验所有权
    if (userId !== undefined && diary.userId !== userId) {
      throw new ForbiddenException('无权修改他人的情绪日记');
    }
    return this.prisma.emotionDiary.update({ where: { id }, data: dto });
  }

  async myPage(dto: PaginationDto, userId: number, params?: { diaryDate?: string }) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = { userId };

    if (params?.diaryDate) {
      where.diaryDate = params.diaryDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.emotionDiary.findMany({
        where,
        include: {
          analyses: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { diaryDate: 'desc' },
      }),
      this.prisma.emotionDiary.count({ where }),
    ]);

    return { records, total, currentPage, size };
  }

  async delete(id: number, userId: number) {
    const diary = await this.getDiaryOrFail(id);
    if (diary.userId !== userId) {
      throw new ForbiddenException('无权删除他人的情绪日记');
    }
    return this.prisma.emotionDiary.delete({ where: { id } });
  }

  async myStatistics(userId: number): Promise<EmotionStatistics> {
    const diaries = await this.prisma.emotionDiary.findMany({
      where: { userId },
      orderBy: { diaryDate: 'asc' },
    });

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 总数与本月数
    const totalCount = diaries.length;
    const thisMonthCount = diaries.filter((d) => d.diaryDate && d.diaryDate.startsWith(thisMonth)).length;

    // 均值
    const withScore = diaries.filter((d): d is typeof d & { moodScore: number } => d.moodScore != null);
    const withSleep = diaries.filter((d): d is typeof d & { sleepQuality: number } => d.sleepQuality != null);
    const withStress = diaries.filter((d): d is typeof d & { stressLevel: number } => d.stressLevel != null);
    const averageMoodScore = withScore.length
      ? Math.round((withScore.reduce((s, d) => s + d.moodScore, 0) / withScore.length) * 10) / 10
      : null;
    const averageSleepQuality = withSleep.length
      ? Math.round((withSleep.reduce((s, d) => s + d.sleepQuality, 0) / withSleep.length) * 10) / 10
      : null;
    const averageStressLevel = withStress.length
      ? Math.round((withStress.reduce((s, d) => s + d.stressLevel, 0) / withStress.length) * 10) / 10
      : null;

    // 月度情绪趋势
    const monthMap = new Map<string, { sum: number; count: number }>();
    for (const d of diaries) {
      if (!d.diaryDate || d.moodScore == null) continue;
      const month = d.diaryDate.slice(0, 7);
      const entry = monthMap.get(month) || { sum: 0, count: 0 };
      entry.sum += d.moodScore;
      entry.count += 1;
      monthMap.set(month, entry);
    }
    const moodTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { sum, count }]) => ({
        month,
        avgScore: Math.round((sum / count) * 10) / 10,
        count,
      }));

    // 情绪分布（dominantEmotion）
    const emotionMap = new Map<string, number>();
    for (const d of diaries) {
      if (!d.dominantEmotion) continue;
      emotionMap.set(d.dominantEmotion, (emotionMap.get(d.dominantEmotion) || 0) + 1);
    }
    const emotionDistribution = Array.from(emotionMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([emotion, count]) => ({ emotion, count }));

    // 压力与睡眠对照（最近 30 条有数据的）
    const withStressSleep = diaries.filter(
      (d): d is typeof d & { diaryDate: string; stressLevel: number; sleepQuality: number } =>
        !!d.diaryDate && d.stressLevel != null && d.sleepQuality != null,
    );
    const stressSleepData = withStressSleep
      .slice(-30)
      .map((d) => ({
        date: d.diaryDate,
        stressLevel: d.stressLevel,
        sleepQuality: d.sleepQuality,
      }));

    // 触发因素分析
    const triggerMap = new Map<string, number>();
    for (const d of diaries) {
      if (!d.emotionTriggers) continue;
      const triggers = typeof d.emotionTriggers === 'string'
        ? d.emotionTriggers.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
        : d.emotionTriggers;
      for (const t of triggers) {
        triggerMap.set(t, (triggerMap.get(t) || 0) + 1);
      }
    }
    const triggerAnalysis = Array.from(triggerMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([trigger, count]) => ({ trigger, count }));

    return {
      overview: {
        totalCount,
        thisMonthCount,
        averageMoodScore,
        averageSleepQuality,
        averageStressLevel,
      },
      moodTrend,
      emotionDistribution,
      stressSleepData,
      triggerAnalysis,
    };
  }

  private async getDiaryOrFail(id: number) {
    const diary = await this.prisma.emotionDiary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('情绪日记不存在');
    return diary;
  }
}
