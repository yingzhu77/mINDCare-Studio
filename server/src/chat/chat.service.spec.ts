import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  const mockPrisma = {
    chatSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    aiAnalysisResult: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  const mockConfig = {
    isMockAi: true,
  };

  const mockAiService = {
    chatStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sessionPage', () => {
    const sessions = [
      {
        id: 1,
        sessionId: 's1',
        userId: 1,
        userName: '小明',
        startTime: new Date(),
        endTime: null,
        messageCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        emotionTags: null,
        aiSummary: null,
        riskLevel: null,
        user: { id: 1, username: 'xiaoming' },
        messages: [
          { content: '<p>助手回复内容较长，需要截断处理</p>'.repeat(10) },
        ],
      },
    ];

    it('应分页返回会话列表并生成 previewText', async () => {
      mockPrisma.chatSession.findMany.mockResolvedValue(sessions);
      mockPrisma.chatSession.count.mockResolvedValue(1);

      const result = await service.sessionPage({ currentPage: 1, size: 10 });
      expect(result.total).toBe(1);
      expect(result.records[0].previewText).toBeDefined();
      expect(result.records[0].previewText.length).toBeLessThanOrEqual(163);
      expect(mockPrisma.chatSession.findMany).toHaveBeenCalled();
    });

    it('应支持按 userName 筛选', async () => {
      mockPrisma.chatSession.findMany.mockResolvedValue([]);
      mockPrisma.chatSession.count.mockResolvedValue(0);

      await service.sessionPage({ currentPage: 1, size: 10 }, { userName: '小明' });
      const callArgs = mockPrisma.chatSession.findMany.mock.calls[0][0];
      expect(callArgs.where.userName).toEqual({ contains: '小明' });
    });

    it('应支持按 status 筛选', async () => {
      mockPrisma.chatSession.findMany.mockResolvedValue([]);
      mockPrisma.chatSession.count.mockResolvedValue(0);

      await service.sessionPage({ currentPage: 1, size: 10 }, { status: 'active' });
      const callArgs = mockPrisma.chatSession.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe('active');
    });
  });

  describe('sessionDetail', () => {
    const session = {
      id: 1,
      sessionId: 's1',
      userId: 1,
      userName: '小明',
      startTime: new Date(),
      endTime: null,
      messageCount: 2,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      emotionTags: null,
      aiSummary: null,
      riskLevel: null,
      user: { id: 1, username: 'xiaoming' },
    };

    it('应返回会话详情', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      const result = await service.sessionDetail('s1');
      expect(result.sessionId).toBe('s1');
    });

    it('会话不存在应抛 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(service.sessionDetail('not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sessionMessages', () => {
    it('应返回消息列表', async () => {
      const messages = [{ id: 1, sessionId: 's1', role: 'user', content: '你好' }];
      mockPrisma.chatMessage.findMany.mockResolvedValue(messages);

      const result = await service.sessionMessages('s1');
      expect(result).toEqual(messages);
      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: 's1' },
        orderBy: { messageTime: 'asc' },
      });
    });
  });

  describe('mySessions', () => {
    it('应返回用户会话列表并附带最后一条消息预览', async () => {
      const records = [
        {
          id: 1,
          sessionId: 's1',
          userId: 1,
          userName: '小明',
          startTime: new Date(),
          endTime: new Date(),
          messageCount: 2,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          emotionTags: null,
          aiSummary: null,
          riskLevel: null,
          messages: [
            { content: '你好，有什么可以帮助你的？', messageTime: new Date() },
          ],
        },
      ];
      mockPrisma.chatSession.findMany.mockResolvedValue(records);
      mockPrisma.chatSession.count.mockResolvedValue(1);

      const result = await service.mySessions(1, { currentPage: 1, size: 10 });
      expect(result.total).toBe(1);
      expect(result.records[0].lastMessage).toBeDefined();
      expect(result.records[0].lastTime).toBeDefined();
    });
  });

  describe('deleteSession', () => {
    const session = { id: 1, sessionId: 's1', userId: 1, userName: '小明' };

    it('应级联删除会话及相关数据', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));

      const result = await service.deleteSession('s1', 1);
      expect(result.code).toBe(200);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('会话不存在应抛 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(service.deleteSession('not-exist', 1)).rejects.toThrow(NotFoundException);
    });

    it('非作者删除应抛 NotFoundException（隐藏真实存在）', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      await expect(service.deleteSession('s1', 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportSession', () => {
    const session = { id: 1, sessionId: 's1', userId: 1, userName: '小明', startTime: new Date(), endTime: new Date(), messageCount: 2, status: 'active', createdAt: new Date(), updatedAt: new Date(), emotionTags: null, aiSummary: null, riskLevel: null };
    const messages = [
      { role: 'user', content: '你好', messageTime: new Date() },
    ];

    it('应导出完整会话 JSON', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      mockPrisma.chatMessage.findMany.mockResolvedValue(messages);

      const result = await service.exportSession('s1', 1);
      expect(result.session.sessionId).toBe('s1');
      expect(result.messages).toHaveLength(1);
      expect(result.exportedAt).toBeDefined();
    });

    it('会话不存在应抛 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);
      await expect(service.exportSession('not-exist', 1)).rejects.toThrow(NotFoundException);
    });

    it('非作者导出应抛 NotFoundException', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(session);
      await expect(service.exportSession('s1', 999)).rejects.toThrow(NotFoundException);
    });
  });
});
