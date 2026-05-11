import {
  Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 管理端：咨询记录列表
  @Get('psychological-chat/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  sessionPage(
    @Query() dto: PaginationDto,
    @Query('userName') userName?: string,
    @Query('status') status?: string,
  ) {
    return this.chatService.sessionPage(dto, { userName, status });
  }

  // 管理端：会话详情
  @Get('psychological-chat/sessions/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  sessionDetail(@Param('sessionId') sessionId: string) {
    return this.chatService.sessionDetail(sessionId);
  }

  // 管理端：会话消息列表
  @Get('psychological-chat/sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  sessionMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.sessionMessages(sessionId);
  }

  // 管理端：会话情绪分析
  @Get('psychological-chat/session/:sessionId/emotion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  sessionEmotion(@Param('sessionId') sessionId: string) {
    return this.chatService.sessionEmotion(sessionId);
  }

  // 用户端：发送消息 (SSE)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('chat/send')
  @UseGuards(JwtAuthGuard)
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    return this.chatService.sendMessage(dto, user.sub, user.username, res);
  }

  // 用户端：我的会话列表
  @Get('chat/sessions/my')
  @UseGuards(JwtAuthGuard)
  mySessions(
    @Query() dto: PaginationDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.mySessions(userId, dto);
  }

  // 用户端：获取会话消息（校验所有权）
  @Get('chat/session/:sessionId/messages')
  @UseGuards(JwtAuthGuard)
  sessionMessagesByUser(
    @Param('sessionId') sessionId: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.sessionMessagesByUser(sessionId, userId);
  }

  // 用户端：删除会话
  @Delete('chat/session/:sessionId')
  @UseGuards(JwtAuthGuard)
  deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.deleteSession(sessionId, userId);
  }

  // 用户端：导出会话
  @Get('chat/session/:sessionId/export')
  @UseGuards(JwtAuthGuard)
  exportSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.exportSession(sessionId, userId);
  }
}
