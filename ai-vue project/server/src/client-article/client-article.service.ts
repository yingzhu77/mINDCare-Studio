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

    return { records, total, currentPage, size };
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
    return this.getMyArticleOrFail(id, userId);
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
