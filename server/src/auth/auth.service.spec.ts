import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfig = {};

  const fakeUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'user',
    status: 1,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== login ====================

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'correct-password' };
    const loginDtoEmail = { username: 'test@example.com', password: 'correct-password' };

    it('应使用用户名登录成功并返回 token 和用户信息', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('user');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ username: 'testuser' }, { email: 'testuser' }] },
      });
    });

    it('应使用邮箱登录成功', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDtoEmail);
      expect(result.user.id).toBe(1);
    });

    it('密码错误应抛出 UnauthorizedException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('用户不存在应抛出 UnauthorizedException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('禁用用户应抛出 ForbiddenException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...fakeUser, status: 0 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== register ====================

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    };

    it('应成功注册并返回不含密码哈希的用户信息', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        status: 1,
      });

      const result = await service.register(registerDto);

      expect(result.id).toBe(2);
      expect(result.username).toBe('newuser');
      expect(result.role).toBe('user');
      // 不应暴露 passwordHash
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('重复用户名应抛出 ConflictException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(fakeUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('重复邮箱应抛出 ConflictException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(fakeUser);

      await expect(
        service.register({ ...registerDto, username: 'different' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==================== getCurrentUser ====================

  describe('getCurrentUser', () => {
    it('应返回用户信息（不含 passwordHash）', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        status: 1,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.getCurrentUser(1);
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
    });

    it('用户不存在应抛出 UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
