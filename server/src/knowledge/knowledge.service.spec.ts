import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const mockPrisma = {
    knowledgeCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    knowledgeArticle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knowledgeArticleRevision: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotification = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ================== 分类管理 ==================

  describe('getCategoryTree', () => {
    it('应返回树形分类结构', async () => {
      const categories = [
        { id: 1, categoryName: '心理知识', parentId: null, sortOrder: 1 },
        { id: 2, categoryName: '情绪管理', parentId: 1, sortOrder: 1 },
        { id: 3, categoryName: '压力应对', parentId: 1, sortOrder: 2 },
      ];
      mockPrisma.knowledgeCategory.findMany.mockResolvedValue(categories);

      const result = await service.getCategoryTree();
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].categoryName).toBe('情绪管理');
    });

    it('空分类应返回空数组', async () => {
      mockPrisma.knowledgeCategory.findMany.mockResolvedValue([]);
      const result = await service.getCategoryTree();
      expect(result).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('应创建分类并返回结果', async () => {
      const dto = { categoryName: '新分类', sortOrder: 1 };
      const created = { id: 10, ...dto, parentId: null };
      mockPrisma.knowledgeCategory.create.mockResolvedValue(created);

      const result = await service.createCategory(dto);
      expect(result.id).toBe(10);
      expect(mockPrisma.knowledgeCategory.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('updateCategory', () => {
    it('应更新已有分类', async () => {
      mockPrisma.knowledgeCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.knowledgeCategory.update.mockResolvedValue({ id: 1, categoryName: '更新后' });

      const result = await service.updateCategory(1, { categoryName: '更新后' });
      expect(result.categoryName).toBe('更新后');
    });

    it('分类不存在应抛 NotFoundException', async () => {
      mockPrisma.knowledgeCategory.findUnique.mockResolvedValue(null);
      await expect(service.updateCategory(999, { categoryName: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCategory', () => {
    it('应删除分类并将子分类移到根层级', async () => {
      mockPrisma.knowledgeCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.knowledgeCategory.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.knowledgeCategory.delete.mockResolvedValue({ id: 1 });

      await service.deleteCategory(1);
      expect(mockPrisma.knowledgeCategory.updateMany).toHaveBeenCalledWith({
        where: { parentId: 1 },
        data: { parentId: null },
      });
      expect(mockPrisma.knowledgeCategory.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('分类不存在应抛 NotFoundException', async () => {
      mockPrisma.knowledgeCategory.findUnique.mockResolvedValue(null);
      await expect(service.deleteCategory(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ================== 文章管理 ==================

  describe('articlePage', () => {
    const articles = [
      { id: 1, title: '测试文章', status: 'published', category: { id: 1, categoryName: '心理' }, author: { id: 1, username: 'admin' } },
    ];

    it('应分页返回文章列表', async () => {
      mockPrisma.knowledgeArticle.findMany.mockResolvedValue(articles);
      mockPrisma.knowledgeArticle.count.mockResolvedValue(1);

      const result = await service.articlePage({ currentPage: 1, size: 10 });
      expect(result.total).toBe(1);
      expect(result.records).toEqual(articles);
    });

    it('应支持按 title 筛选', async () => {
      mockPrisma.knowledgeArticle.findMany.mockResolvedValue([]);
      mockPrisma.knowledgeArticle.count.mockResolvedValue(0);

      await service.articlePage({ currentPage: 1, size: 10 }, { title: '测试' });
      const callArgs = mockPrisma.knowledgeArticle.findMany.mock.calls[0][0];
      expect(callArgs.where.title).toEqual({ contains: '测试' });
    });

    it('应支持按 status 筛选', async () => {
      mockPrisma.knowledgeArticle.findMany.mockResolvedValue([]);
      mockPrisma.knowledgeArticle.count.mockResolvedValue(0);

      await service.articlePage({ currentPage: 1, size: 10 }, { status: 'draft' });
      const callArgs = mockPrisma.knowledgeArticle.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe('draft');
    });

    it('应支持按 categoryId 筛选', async () => {
      mockPrisma.knowledgeArticle.findMany.mockResolvedValue([]);
      mockPrisma.knowledgeArticle.count.mockResolvedValue(0);

      await service.articlePage({ currentPage: 1, size: 10 }, { categoryId: 5 });
      const callArgs = mockPrisma.knowledgeArticle.findMany.mock.calls[0][0];
      expect(callArgs.where.categoryId).toBe(5);
    });
  });

  describe('articleDetail', () => {
    it('应返回文章详情', async () => {
      const article = { id: 1, title: '文章', category: {}, author: {} };
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(article);

      const result = await service.articleDetail(1);
      expect(result.id).toBe(1);
    });

    it('文章不存在应抛 NotFoundException', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(null);
      await expect(service.articleDetail(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createArticle', () => {
    it('应创建文章并设置 authorId 和 publishedAt', async () => {
      const dto = { title: '新文章', content: '内容', categoryId: 1 };
      const created = { id: 10, ...dto, authorId: 1, status: 'published', publishedAt: new Date() };
      mockPrisma.knowledgeArticle.create.mockResolvedValue(created);

      const result = await service.createArticle(dto, 1);
      expect(result.authorId).toBe(1);
      expect(result.status).toBe('published');
    });
  });

  describe('updateArticle', () => {
    it('管理员自建文章任意状态可编辑', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({
        id: 1, title: '原文', status: 'published', author: { role: 'admin' },
      });
      mockPrisma.knowledgeArticle.update.mockResolvedValue({ id: 1, title: '更新后' });

      const result = await service.updateArticle(1, { title: '更新后' });
      expect(result.title).toBe('更新后');
    });

    it('用户投稿应抛 ForbiddenException', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({
        id: 1, title: '文章', status: 'draft', author: { role: 'user' },
      });

      await expect(service.updateArticle(1, { title: '新标题' })).rejects.toThrow(ForbiddenException);
    });

    it('文章不存在应抛 NotFoundException', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(null);
      await expect(service.updateArticle(999, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteArticle', () => {
    it('应删除文章', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.knowledgeArticle.delete.mockResolvedValue({ id: 1 });

      await service.deleteArticle(1);
      expect(mockPrisma.knowledgeArticle.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('文章不存在应抛 NotFoundException', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(null);
      await expect(service.deleteArticle(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateArticleStatus', () => {
    it('草稿转发布应成功 — draft → published', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({ id: 1, title: '文章', status: 'draft', authorId: 1 });
      mockPrisma.knowledgeArticle.update.mockResolvedValue({ id: 1, status: 'published' });

      await service.updateArticleStatus(1, 'published');
      const callData = mockPrisma.knowledgeArticle.update.mock.calls[0][0].data;
      expect(callData.status).toBe('published');
      expect(callData.publishedAt).toBeDefined();
    });

    it('已发布转下线应成功 — published → offline', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({ id: 1, title: '文章', status: 'published', authorId: 1 });
      mockPrisma.knowledgeArticle.update.mockResolvedValue({ id: 1, status: 'offline' });

      await service.updateArticleStatus(1, 'offline');
      expect(mockPrisma.knowledgeArticle.update).toHaveBeenCalled();
    });

    it('不允许非法状态过渡（如 draft → rejected）', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({ id: 1, title: '文章', status: 'draft', authorId: 1 });

      await expect(service.updateArticleStatus(1, 'rejected')).rejects.toThrow(ForbiddenException);
    });

    it('不允许通过此接口直接发布待审核文章', async () => {
      mockPrisma.knowledgeArticle.findUnique.mockResolvedValue({ id: 1, title: '文章', status: 'pending_review', authorId: 2 });

      await expect(service.updateArticleStatus(1, 'published')).rejects.toThrow(ForbiddenException);
    });
  });
});
