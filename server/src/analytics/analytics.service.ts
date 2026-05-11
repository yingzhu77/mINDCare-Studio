import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      articleCount,
      publishedArticleCount,
      userCount,
      sessionCount,
      activeSessionCount,
      diaryCount,
      todayDiaryCount,
      analysisCount,
      riskDistribution,
    ] = await Promise.all([
      this.prisma.knowledgeArticle.count(),
      this.prisma.knowledgeArticle.count({ where: { status: 'published' } }),
      this.prisma.user.count(),
      this.prisma.chatSession.count(),
      this.prisma.chatSession.count({ where: { status: 'active' } }),
      this.prisma.emotionDiary.count(),
      this.prisma.emotionDiary.count({
        where: { diaryDate: new Date().toISOString().slice(0, 10) },
      }),
      this.prisma.aiAnalysisResult.count({ where: { status: 'success' } }),
      this.prisma.aiAnalysisResult.groupBy({
        by: ['riskLevel'],
        where: { riskLevel: { not: null } },
        _count: true,
      }),
    ]);

    return {
      articleCount,
      publishedArticleCount,
      userCount,
      sessionCount,
      activeSessionCount,
      diaryCount,
      todayDiaryCount,
      analysisCount,
      riskDistribution,
    };
  }

  async getTrends(type: string) {
    switch (type) {
      case 'emotion':
        return this.getEmotionTrends();
      case 'session':
        return this.getSessionTrends();
      case 'article':
        return this.getArticleTrends();
      default:
        throw new BadRequestException(`Unsupported trend type: ${type}`);
    }
  }

  /**
   * 使用 Prisma 查询 + 内存聚合，避免数据库特定 SQL 函数
   */
  private async getEmotionTrends() {
    const diaries = await this.prisma.emotionDiary.findMany({
      select: { diaryDate: true, moodScore: true },
    });

    const map = new Map<string, { sum: number; count: number }>();
    for (const d of diaries) {
      if (!d.diaryDate || d.moodScore == null) continue;
      const month = d.diaryDate.slice(0, 7); // 'YYYY-MM'
      const entry = map.get(month) || { sum: 0, count: 0 };
      entry.sum += d.moodScore;
      entry.count += 1;
      map.set(month, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { sum, count }]) => ({
        month,
        avgScore: Math.round((sum / count) * 10) / 10,
        count,
      }));
  }

  private async getSessionTrends() {
    const sessions = await this.prisma.chatSession.findMany({
      select: { startTime: true },
    });

    const map = new Map<string, number>();
    for (const s of sessions) {
      if (!s.startTime) continue;
      const date = s.startTime.toISOString().slice(0, 10);
      map.set(date, (map.get(date) || 0) + 1);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  private async getArticleTrends() {
    const articles = await this.prisma.knowledgeArticle.findMany({
      where: { publishedAt: { not: null } },
      select: { publishedAt: true },
    });

    const map = new Map<string, number>();
    for (const a of articles) {
      if (!a.publishedAt) continue;
      const date = a.publishedAt.toISOString().slice(0, 10);
      map.set(date, (map.get(date) || 0) + 1);
    }

    let cumulative = 0;
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dailyCount]) => {
        cumulative += dailyCount;
        return { date, cumulativeCount: cumulative };
      });
  }
}
