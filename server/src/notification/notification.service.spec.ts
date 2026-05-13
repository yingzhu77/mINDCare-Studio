import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockGateway = {
    notifyUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应创建通知并返回结果', async () => {
      const input = { userId: 1, type: 'article_review', title: '审核通知' };
      const expected = { id: 1, ...input, isRead: 0 };
      mockPrisma.notification.create.mockResolvedValue(expected);

      const result = await service.create(input);
      expect(result).toEqual(expected);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('findByUser', () => {
    it('应分页返回用户通知列表', async () => {
      const records = [
        { id: 1, userId: 1, type: 'article_review', title: '通知1', isRead: 0, createdAt: new Date() },
        { id: 2, userId: 1, type: 'article_review', title: '通知2', isRead: 1, createdAt: new Date() },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(records);
      mockPrisma.notification.count.mockResolvedValue(2);

      const result = await service.findByUser(1, 1, 20);
      expect(result.records).toEqual(records);
      expect(result.total).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.size).toBe(20);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('countUnread', () => {
    it('应返回未读通知数量', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);
      const result = await service.countUnread(1);
      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 1, isRead: 0 },
      });
    });
  });

  describe('markAsRead', () => {
    it('应标记指定通知为已读', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
      await service.markAsRead(1, 1);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: { isRead: 1 },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('应标记全部通知为已读', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });
      await service.markAllAsRead(1);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, isRead: 0 },
        data: { isRead: 1 },
      });
    });
  });
});
