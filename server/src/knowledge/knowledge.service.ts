import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ================== 分类管理 ==================

  async getCategoryTree() {
    const categories = await this.prisma.knowledgeCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return this.buildTree(categories);
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.knowledgeCategory.create({ data: dto });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.getCategoryOrFail(id);
    return this.prisma.knowledgeCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: number) {
    await this.getCategoryOrFail(id);
    // 将子分类移到根层级
    await this.prisma.knowledgeCategory.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });
    return this.prisma.knowledgeCategory.delete({ where: { id } });
  }

  // ================== 文章管理 ==================

  async articlePage(dto: PaginationDto, params?: {
    title?: string;
    status?: string;
    categoryId?: number;
  }) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = {};

    if (params?.title) {
      where.title = { contains: params.title };
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.categoryId !== undefined) {
      where.categoryId = params.categoryId;
    }

    const [records, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          categoryId: true,
          authorId: true,
          reviewerId: true,
          summary: true,
          tags: true,
          coverImage: true,
          readCount: true,
          status: true,
          rejectReason: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, categoryName: true } },
          author: { select: { id: true, username: true, role: true } },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    return { records, total, currentPage, size };
  }

  async articleDetail(id: number) {
    return this.getArticleOrFail(id);
  }

  async createArticle(dto: CreateArticleDto, authorId: number) {
    return this.prisma.knowledgeArticle.create({
      data: { ...dto, authorId, status: 'published', publishedAt: new Date() },
    });
  }

  async updateArticle(id: number, dto: UpdateArticleDto) {
    const article = await this.getArticleOrFail(id);
    // 仅管理员自建文章可编辑，用户投稿一律不可直接编辑
    if (article.author?.role !== 'admin') {
      throw new ForbiddenException('仅管理员自建文章可编辑');
    }
    return this.prisma.knowledgeArticle.update({ where: { id }, data: dto });
  }

  async deleteArticle(id: number, operatorId?: number, reason?: string) {
    const article = await this.getArticleOrFail(id);
    const result = await this.prisma.knowledgeArticle.delete({ where: { id } });

    if (this.shouldNotifyAuthor(article, operatorId)) {
      await this.notificationService.create({
        userId: article.authorId,
        type: 'article_operation',
        title: '您的文章已被删除',
        content: `文章「${article.title}」已被管理员删除。原因：${reason || '未提供'}`,
        relatedId: id,
      });
    }

    return result;
  }

  /**
   * 管理端直接发布/下线文章（仅限主文章）
   * 约束：draft/offline → published（后台自建或重新发布）、published → offline（下线）
   * pending_review / rejected → published 必须走审核专用接口
   * 修订状态必须走审核专用接口
   */
  async updateArticleStatus(id: number, status: string, operatorId?: number, reason?: string) {
    const article = await this.getArticleOrFail(id);
    const oldStatus = article.status;

    // 只允许以下两种过渡
    const allowedTransitions: Record<string, string[]> = {
      draft: ['published'],
      published: ['offline'],
      offline: ['published'],
    };
    const allowed = allowedTransitions[oldStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new ForbiddenException(`主文章状态不允许从 ${oldStatus} 直接变为 ${status}`);
    }

    const data: any = { status };
    if (status === 'published') {
      data.publishedAt = new Date();
    }

    const result = await this.prisma.knowledgeArticle.update({ where: { id }, data });

    if (status === 'offline' && this.shouldNotifyAuthor(article, operatorId)) {
      await this.notificationService.create({
        userId: article.authorId,
        type: 'article_operation',
        title: '您的文章已被下线',
        content: `文章「${article.title}」已被管理员下线。原因：${reason || '未提供'}`,
        relatedId: id,
      });
    }

    return result;
  }

  // ================== 审核专用接口 ==================

  async reviewPage(dto: PaginationDto, params?: {
    status?: string;
  }) {
    const { currentPage = 1, size = 10 } = dto;
    const statusFilter = params?.status;

    // 同时查主文章和修订（列表不查 content 正文）
    // 仅显示用户投稿，排除管理员自建文章
    const articleWhere: any = {
      ...(statusFilter ? { status: statusFilter } : {}),
      author: { role: { not: 'admin' } },
    };
    const revisionWhere: any = {
      ...(statusFilter ? { status: statusFilter } : {}),
      author: { role: { not: 'admin' } },
    };

    const articleSelect = {
      id: true,
      title: true,
      categoryId: true,
      authorId: true,
      summary: true,
      tags: true,
      coverImage: true,
      status: true,
      rejectReason: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, categoryName: true } },
      author: { select: { id: true, username: true } },
    };

    const revisionSelect = {
      id: true,
      articleId: true,
      authorId: true,
      title: true,
      categoryId: true,
      summary: true,
      tags: true,
      coverImage: true,
      status: true,
      rejectReason: true,
      submittedAt: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      article: { select: { id: true, title: true } },
      category: { select: { id: true, categoryName: true } },
      author: { select: { id: true, username: true } },
    };

    const [articles, articlesTotal, revisions, revisionsTotal] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where: articleWhere,
        select: articleSelect,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.knowledgeArticle.count({ where: articleWhere }),
      this.prisma.knowledgeArticleRevision.findMany({
        where: revisionWhere,
        select: revisionSelect,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.knowledgeArticleRevision.count({ where: revisionWhere }),
    ]);

    // 合并为统一列表
    const articleRecords = articles.map(a => ({
      ...a,
      reviewType: 'article' as const,
      reviewId: a.id,
    }));
    const revisionRecords = revisions.map(r => ({
      ...r,
      reviewType: 'revision' as const,
      reviewId: r.id,
    }));

    const allRecords = [...articleRecords, ...revisionRecords].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
    );

    // 手动分页
    const total = articlesTotal + revisionsTotal;
    const start = (currentPage - 1) * size;
    const records = allRecords.slice(start, start + size);

    return { records, total, currentPage, size };
  }

  async reviewDetail(reviewType: string, id: number) {
    if (reviewType === 'article') {
      return this.getArticleOrFail(id);
    }
    if (reviewType === 'revision') {
      const revision = await this.prisma.knowledgeArticleRevision.findUnique({
        where: { id },
        include: {
          article: { select: { id: true, title: true, status: true } },
          category: { select: { id: true, categoryName: true } },
          author: { select: { id: true, username: true } },
        },
      });
      if (!revision) throw new NotFoundException('修订记录不存在');
      return revision;
    }
    throw new NotFoundException('审核类型不存在');
  }

  async reviewStatusUpdate(
    reviewType: string, id: number, status: string,
    reviewerId: number, rejectReason?: string,
  ) {
    if (reviewType === 'article') {
      return this.reviewArticleStatus(id, status, reviewerId, rejectReason);
    }
    if (reviewType === 'revision') {
      return this.reviewRevisionStatus(id, status, reviewerId, rejectReason);
    }
    throw new NotFoundException('审核类型不存在');
  }

  /** 审核主文章（首次投稿） */
  private async reviewArticleStatus(id: number, status: string, reviewerId: number, rejectReason?: string) {
    const article = await this.getArticleOrFail(id);
    if (article.status !== 'pending_review' && article.status !== 'rejected') {
      throw new ForbiddenException('该文章不在可审核状态');
    }
    if (status !== 'published' && status !== 'rejected') {
      throw new ForbiddenException('审核结果只能是 published 或 rejected');
    }

    const data: any = { status, reviewerId };
    if (status === 'published') {
      data.publishedAt = new Date();
    }
    if (status === 'rejected' && rejectReason) {
      data.rejectReason = rejectReason;
    }

    const result = await this.prisma.knowledgeArticle.update({ where: { id }, data });

    // 通知作者
    if (this.shouldNotifyAuthor(article, reviewerId)) {
      const isApproved = status === 'published';
      await this.notificationService.create({
        userId: article.authorId,
        type: 'article_review',
        title: isApproved ? '您的文章已通过审核' : '您的文章未通过审核',
        content: isApproved
          ? `文章「${article.title}」已通过审核并发布`
          : `文章「${article.title}」未通过审核。原因：${rejectReason || '未提供'}`,
        relatedId: id,
      });
    }

    return result;
  }

  /** 审核修订（二次修改） */
  private async reviewRevisionStatus(id: number, status: string, reviewerId: number, rejectReason?: string) {
    const revision = await this.prisma.knowledgeArticleRevision.findUnique({
      where: { id },
      include: {
        article: true,
        author: { select: { id: true, role: true } },
      },
    });
    if (!revision) throw new NotFoundException('修订记录不存在');
    if (revision.status !== 'pending_review') {
      throw new ForbiddenException('该修订不在可审核状态');
    }
    if (status !== 'published' && status !== 'rejected') {
      throw new ForbiddenException('审核结果只能是 published 或 rejected');
    }

    const articleTitle = revision.article?.title || revision.title;

    if (status === 'published') {
      // 通过：事务内更新主文章 + 修订状态，避免中间状态不一致
      const articleId = revision.articleId;
      await this.prisma.$transaction([
        this.prisma.knowledgeArticle.update({
          where: { id: articleId },
          data: {
            title: revision.title,
            categoryId: revision.categoryId,
            summary: revision.summary,
            tags: revision.tags,
            coverImage: revision.coverImage,
            content: revision.content,
            publishedAt: new Date(),
          },
        }),
        this.prisma.knowledgeArticleRevision.update({
          where: { id },
          data: { status: 'published', reviewerId, reviewedAt: new Date() },
        }),
      ]);

      // 通知作者（不需要事务保护）
      if (this.shouldNotifyAuthor(revision, reviewerId)) {
        await this.notificationService.create({
          userId: revision.authorId,
          type: 'article_review',
          title: '您的文章修改已通过审核',
          content: `文章「${articleTitle}」的修改已通过审核并更新`,
          relatedId: revision.articleId,
        });
      }
    } else {
      // 驳回：只改修订记录状态
      await this.prisma.knowledgeArticleRevision.update({
        where: { id },
        data: { status: 'rejected', reviewerId, rejectReason: rejectReason || null, reviewedAt: new Date() },
      });

      // 通知作者
      if (this.shouldNotifyAuthor(revision, reviewerId)) {
        await this.notificationService.create({
          userId: revision.authorId,
          type: 'article_review',
          title: '您的文章修改未通过审核',
          content: `文章「${articleTitle}」的修改未通过审核。原因：${rejectReason || '未提供'}`,
          relatedId: revision.articleId,
        });
      }
    }

    return { id };
  }

  async pendingReviewCount() {
    const [articleCount, revisionCount] = await Promise.all([
      this.prisma.knowledgeArticle.count({
        where: { status: 'pending_review', author: { role: { not: 'admin' } } },
      }),
      this.prisma.knowledgeArticleRevision.count({
        where: { status: 'pending_review', author: { role: { not: 'admin' } } },
      }),
    ]);
    return { count: articleCount + revisionCount };
  }

  async deleteRevision(id: number) {
    const revision = await this.prisma.knowledgeArticleRevision.findUnique({ where: { id } });
    if (!revision) throw new NotFoundException('修订记录不存在');
    return this.prisma.knowledgeArticleRevision.delete({ where: { id } });
  }

  // ================== 公开查询（无需认证） ==================

  async publishedPage(dto: PaginationDto, params?: {
    title?: string;
    categoryId?: number;
  }) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = { status: 'published' };

    if (params?.title) {
      where.title = { contains: params.title };
    }
    if (params?.categoryId !== undefined) {
      where.categoryId = params.categoryId;
    }

    const [records, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          summary: true,
          tags: true,
          coverImage: true,
          readCount: true,
          publishedAt: true,
          categoryId: true,
          category: { select: { id: true, categoryName: true } },
          author: { select: { id: true, username: true } },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    return { records, total, currentPage, size };
  }

  async publishedDetail(id: number) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { id, status: 'published' },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        tags: true,
        coverImage: true,
        readCount: true,
        publishedAt: true,
        createdAt: true,
        categoryId: true,
        category: { select: { id: true, categoryName: true } },
        author: { select: { id: true, username: true } },
      },
    });
    if (!article) throw new NotFoundException('文章不存在');

    // 异步增加阅读计数，不阻塞返回
    this.prisma.knowledgeArticle.update({
      where: { id },
      data: { readCount: { increment: 1 } },
    }).catch(() => {});

    return article;
  }

  // ================== 私有方法 ==================

  private buildTree(categories: any[], parentId: number | null = null): any[] {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        children: this.buildTree(categories, c.id),
      }));
  }

  private async getCategoryOrFail(id: number) {
    const cat = await this.prisma.knowledgeCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('分类不存在');
    return cat;
  }

  private async getArticleOrFail(id: number) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, categoryName: true } },
        author: { select: { id: true, username: true, role: true } },
      },
    });
    if (!article) throw new NotFoundException('文章不存在');
    return article;
  }

  private shouldNotifyAuthor(article: any, operatorId?: number) {
    return article.author?.role === 'user' && article.authorId !== operatorId;
  }
}
