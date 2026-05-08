import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          category: { select: { id: true, categoryName: true } },
          author: { select: { id: true, username: true } },
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
      data: { ...dto, authorId },
    });
  }

  async updateArticle(id: number, dto: UpdateArticleDto) {
    await this.getArticleOrFail(id);
    return this.prisma.knowledgeArticle.update({ where: { id }, data: dto });
  }

  async deleteArticle(id: number) {
    await this.getArticleOrFail(id);
    return this.prisma.knowledgeArticle.delete({ where: { id } });
  }

  async updateArticleStatus(id: number, status: string, reviewerId?: number) {
    await this.getArticleOrFail(id);
    const data: any = { status };
    if (status === 'published') {
      data.publishedAt = new Date();
      if (reviewerId) data.reviewerId = reviewerId;
    }
    return this.prisma.knowledgeArticle.update({ where: { id }, data });
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
        author: { select: { id: true, username: true } },
      },
    });
    if (!article) throw new NotFoundException('文章不存在');
    return article;
  }
}
