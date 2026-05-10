import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SendMessageDto } from './dto/chat.dto';
import { AiService } from '../ai/ai.service';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { parseJsonArray } from '../common/utils/json-helper';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly aiService: AiService,
  ) {}

  // ================== 管理端查询 ==================

  async sessionPage(dto: PaginationDto, params?: { userName?: string; status?: string }) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = {};

    if (params?.userName) {
      where.userName = { contains: params.userName };
    }
    if (params?.status) {
      where.status = params.status;
    }

    const [rows, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          messages: {
            orderBy: { messageTime: 'asc' },
            select: { content: true, messageTime: true, role: true },
          },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    const records = rows.map(({ messages, ...rest }) => {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const firstAssistantMsg = messages.find(m => m.role === 'assistant');
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

      const content = firstAssistantMsg?.content || '';
      const plain = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const previewText = plain.length > 160 ? plain.slice(0, 160) + '...' : plain;

      return {
        ...rest,
        emotionTags: parseJsonArray(rest.emotionTags),
        previewText,
        firstMessageTime: firstUserMsg?.messageTime || rest.startTime,
        lastMessageTime: lastMsg?.messageTime || rest.endTime || rest.startTime,
      };
    });

    return { records, total, currentPage, size };
  }

  async sessionDetail(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
    if (!session) throw new NotFoundException('会话不存在');
    return { ...session, emotionTags: parseJsonArray(session.emotionTags) };
  }

  async sessionMessages(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { messageTime: 'asc' },
    });
  }

  async sessionEmotion(sessionId: string) {
    return this.prisma.aiAnalysisResult.findFirst({
      where: { bizType: 'chat_session', chatSession: { sessionId } },
    });
  }

  // ================== 用户端聊天 ==================

  async sendMessage(dto: SendMessageDto, userId: number, userName: string, res: Response) {
    const session = await this.getOrCreateSession(dto.sessionId, userId, userName);

    // 保存用户消息
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.sessionId,
        role: 'user',
        content: dto.content,
      },
    });

    // 更新消息计数
    await this.prisma.chatSession.update({
      where: { sessionId: session.sessionId },
      data: { messageCount: { increment: 1 } },
    });

    // 读取最近上下文
    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.sessionId },
      orderBy: { messageTime: 'desc' },
      take: 20,
    });

    const context = recentMessages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // SSE 流式返回
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    let fullResponse = '';

    try {
      for await (const chunk of this.aiService.chatStream(context)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
      }

      // 保存助手消息
      const assistantMessage = await this.prisma.chatMessage.create({
        data: {
          sessionId: session.sessionId,
          role: 'assistant',
          content: fullResponse,
        },
      });

      await this.prisma.chatSession.update({
        where: { sessionId: session.sessionId },
        data: { messageCount: { increment: 1 }, endTime: new Date() },
      });

      res.write(`data: ${JSON.stringify({
        type: 'done',
        sessionId: session.sessionId,
        messageId: assistantMessage.id,
      })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'AI 服务暂时不可用',
      })}\n\n`);
    }

    res.end();
  }

  // ================== 用户端会话管理 ==================

  async mySessions(userId: number, dto: PaginationDto) {
    const { currentPage = 1, size = 10 } = dto;
    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where,
        include: {
          messages: {
            orderBy: { messageTime: 'desc' },
            take: 1,
            select: { content: true, messageTime: true },
          },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { endTime: { sort: 'desc', nulls: 'last' } },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    const list = records.map(({ messages, ...rest }) => {
      const lastMsg = messages[0];
      const plain = lastMsg
        ? lastMsg.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)
        : '';
      return { ...rest, emotionTags: parseJsonArray(rest.emotionTags), lastMessage: plain, lastTime: lastMsg?.messageTime || rest.startTime };
    });

    return { records: list, total, currentPage, size };
  }

  async deleteSession(sessionId: string, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.userId !== userId) throw new NotFoundException('会话不存在');

    await this.prisma.$transaction(async (tx) => {
      // 级联删除关联分析结果
      await tx.aiAnalysisResult.deleteMany({
        where: { bizType: 'chat_session', bizId: session.id },
      });
      // 删除所有消息
      await tx.chatMessage.deleteMany({
        where: { sessionId },
      });
      // 删除会话
      await tx.chatSession.delete({
        where: { sessionId },
      });
    });

    return { code: 200, message: '会话已删除', data: null };
  }

  async exportSession(sessionId: string, userId: number) {
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.userId !== userId) throw new NotFoundException('会话不存在');

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { messageTime: 'asc' },
      select: { role: true, content: true, messageTime: true },
    });

    return {
      session: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        messageCount: session.messageCount,
      },
      messages,
      exportedAt: new Date().toISOString(),
    };
  }

  private async getOrCreateSession(existingSessionId: string | undefined, userId: number, userName: string) {
    if (existingSessionId) {
      const existing = await this.prisma.chatSession.findUnique({
        where: { sessionId: existingSessionId },
      });
      if (existing) return existing;
    }

    return this.prisma.chatSession.create({
      data: {
        sessionId: randomUUID(),
        userId,
        userName,
      },
    });
  }
}
