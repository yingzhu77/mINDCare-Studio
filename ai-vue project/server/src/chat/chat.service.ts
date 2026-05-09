import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SendMessageDto } from './dto/chat.dto';
import { AiService } from '../ai/ai.service';
import { Response } from 'express';
import { randomUUID } from 'crypto';

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
            where: { role: 'assistant' },
            orderBy: { messageTime: 'asc' },
            take: 1,
            select: { content: true },
          },
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    const records = rows.map(({ messages, ...rest }) => {
      const content = messages[0]?.content || '';
      const plain = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const previewText = plain.length > 160 ? plain.slice(0, 160) + '...' : plain;
      return { ...rest, previewText };
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
    return session;
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
