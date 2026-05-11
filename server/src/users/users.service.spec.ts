import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('paginate', () => {
    const users = [
      { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', status: 1, createdAt: new Date() },
    ];

    it('应分页返回用户列表', async () => {
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.paginate({ currentPage: 1, size: 10 });
      expect(result.total).toBe(1);
      expect(result.records).toEqual(users);
    });

    it('应支持按 keyword 搜索用户名或邮箱', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.paginate({ currentPage: 1, size: 10 }, 'test');
      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toEqual([
        { username: { contains: 'test' } },
        { email: { contains: 'test' } },
      ]);
    });

    it('无 keyword 时不应添加 OR 条件', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.paginate({ currentPage: 1, size: 10 });
      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    const adminUser = { id: 1, username: 'admin', role: 'admin', status: 1 };
    const normalUser = { id: 2, username: 'user', role: 'user', status: 1 };

    it('应更新用户状态', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(normalUser);
      mockPrisma.user.update.mockResolvedValue({ ...normalUser, status: 0 });

      const result = await service.updateStatus(2, 0);
      expect(result.status).toBe(0);
    });

    it('用户不存在应抛 NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(999, 0)).rejects.toThrow(NotFoundException);
    });

    it('禁用最后一个管理员应抛 ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(service.updateStatus(1, 0)).rejects.toThrow(ForbiddenException);
    });

    it('有多个管理员时允许禁用其中一个', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.update.mockResolvedValue({ ...adminUser, status: 0 });

      const result = await service.updateStatus(1, 0);
      expect(result.status).toBe(0);
    });
  });
});
