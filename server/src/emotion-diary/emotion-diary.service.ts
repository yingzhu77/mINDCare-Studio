import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateDiaryDto, UpdateDiaryDto } from './dto/diary.dto';

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

  private async getDiaryOrFail(id: number) {
    const diary = await this.prisma.emotionDiary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('情绪日记不存在');
    return diary;
  }
}
