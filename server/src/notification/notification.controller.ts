import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('通知')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('page')
  @ApiOperation({ summary: '获取当前用户通知列表' })
  async page(
    @CurrentUser('sub') userId: number,
    @Query() dto: PaginationDto,
  ) {
    return this.notificationService.findByUser(userId, dto.currentPage, dto.size);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  async unreadCount(@CurrentUser('sub') userId: number) {
    const count = await this.notificationService.countUnread(userId);
    return { count };
  }

  @Put('read/:id')
  @ApiOperation({ summary: '标记单条通知已读' })
  async read(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    await this.notificationService.markAsRead(id, userId);
    return true;
  }

  @Put('read-all')
  @ApiOperation({ summary: '标记全部已读' })
  async readAll(@CurrentUser('sub') userId: number) {
    await this.notificationService.markAllAsRead(userId);
    return true;
  }
}
