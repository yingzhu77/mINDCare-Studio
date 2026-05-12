import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateClientArticleDto, UpdateClientArticleDto } from './dto/article.dto';

@Injectable()
export class ClientArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async myPage(dto: PaginationDto, userId: number) {
    const { currentPage = 1, size = 10 } = dto;
    const where = { authorId: userId };

    const [records, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        include: {
          category: { select: { id: true, categoryName: true } },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    // 批量查询 hasPendingRevision — 避免 N+1
    const articleIds = records.map(r => r.id);
    const pendingRevisions = articleIds.length > 0
      ? await this.prisma.knowledgeArticleRevision.findMany({
          where: { articleId: { in: articleIds }, status: 'pending_review' },
          select: { articleId: true },
        })
      : [];
    const pendingSet = new Set(pendingRevisions.map(r => r.articleId));

    const recordsWithRevision = records.map(r => ({
      ...r,
      hasPendingRevision: pendingSet.has(r.id),
      revisionStatus: pendingSet.has(r.id) ? 'pending_review' : undefined,
    }));

    return { records: recordsWithRevision, total, currentPage, size };
  }

  async create(dto: CreateClientArticleDto, userId: number) {
    return this.prisma.knowledgeArticle.create({
      data: {
        title: dto.title,
        categoryId: dto.categoryId ?? null,
        summary: dto.summary ?? null,
        tags: dto.tags ?? null,
        coverImage: dto.coverImage ?? null,
        content: dto.content ?? null,
        authorId: userId,
        status: 'draft',
      },
    });
  }

  async update(id: number, dto: UpdateClientArticleDto, userId: number) {
    const article = await this.getMyArticleOrFail(id, userId);

    // 已发布文章 → 创建/更新修订记录，不直接改主文章
    if (article.status === 'published') {
      const existingRevision = await this.prisma.knowledgeArticleRevision.findFirst({
        where: { articleId: id, status: 'pending_review' },
      });

      const revisionData = {
        articleId: id,
        authorId: userId,
        title: dto.title ?? article.title,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : article.categoryId,
        summary: dto.summary !== undefined ? dto.summary : article.summary,
        tags: dto.tags !== undefined ? dto.tags : article.tags,
        coverImage: dto.coverImage !== undefined ? dto.coverImage : article.coverImage,
        content: dto.content !== undefined ? dto.content : article.content,
      };

      if (existingRevision) {
        await this.prisma.knowledgeArticleRevision.update({
          where: { id: existingRevision.id },
          data: revisionData,
        });
      } else {
        await this.prisma.knowledgeArticleRevision.create({ data: revisionData });
      }

      return article; // 返回原文章，提示用户已提交审核
    }

    // 非已发布状态：直接修改主文章
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title: dto.title ?? article.title,
        categoryId: dto.categoryId ?? article.categoryId,
        summary: dto.summary !== undefined ? dto.summary : article.summary,
        tags: dto.tags !== undefined ? dto.tags : article.tags,
        coverImage: dto.coverImage !== undefined ? dto.coverImage : article.coverImage,
        content: dto.content !== undefined ? dto.content : article.content,
      },
    });
  }

  async submit(id: number, userId: number) {
    const article = await this.getMyArticleOrFail(id, userId);

    if (article.status !== 'draft' && article.status !== 'rejected') {
      throw new ForbiddenException('仅草稿或已驳回状态可以提交审核');
    }

    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: { status: 'pending_review', rejectReason: null },
    });
  }

  async detail(id: number, userId: number) {
    const article = await this.getMyArticleOrFail(id, userId);

    // 已发布文章：检查是否有待审修订，有则返回修订内容
    if (article.status === 'published') {
      const pendingRevision = await this.prisma.knowledgeArticleRevision.findFirst({
        where: { articleId: id, status: 'pending_review' },
      });
      if (pendingRevision) {
        // 返回修订版内容，编辑页将看到待审的修改
        return {
          ...article,
          hasPendingRevision: true,
          revisionStatus: 'pending_review',
          // 覆盖为修订版内容，让编辑表单加载用户之前已修改的内容
          title: pendingRevision.title,
          categoryId: pendingRevision.categoryId ?? article.categoryId,
          summary: pendingRevision.summary ?? article.summary,
          tags: pendingRevision.tags ?? article.tags,
          coverImage: pendingRevision.coverImage ?? article.coverImage,
          content: pendingRevision.content ?? article.content,
        };
      }
      return { ...article, hasPendingRevision: false };
    }

    return article;
  }

  private async getMyArticleOrFail(id: number, userId: number) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, categoryName: true } },
      },
    });

    if (!article) throw new NotFoundException('文章不存在');
    if (article.authorId !== userId) throw new ForbiddenException('无权操作此文章');

    return article;
  }
}
