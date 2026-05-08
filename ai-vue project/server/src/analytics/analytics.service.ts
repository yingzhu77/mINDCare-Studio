import { Injectable } from '@nestjs/common';
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
}
