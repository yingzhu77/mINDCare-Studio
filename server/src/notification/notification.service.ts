import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 创建通知并推送 WS 事件
   */
  async create(data: {
    userId: number;
    type: string;
    title: string;
    content?: string;
    relatedId?: number;
  }) {
    const notification = await this.prisma.notification.create({ data });
    // 创建通知后推送未读计数变更
    const count = await this.countUnread(data.userId);
    this.notificationGateway.notifyUnreadCount(data.userId, count);
    return notification;
  }

  /**
   * 获取用户通知列表（分页）
   */
  async findByUser(userId: number, page = 1, size = 20) {
    const where = { userId };
    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { records, total, currentPage: page, size };
  }

  /**
   * 获取未读通知数量
   */
  async countUnread(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: 0 },
    });
  }

  /**
   * 标记通知为已读并推送 WS 事件
   */
  async markAsRead(id: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: 1 },
    });
    const count = await this.countUnread(userId);
    this.notificationGateway.notifyUnreadCount(userId, count);
    return result;
  }

  /**
   * 标记全部已读并推送 WS 事件
   */
  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: 0 },
      data: { isRead: 1 },
    });
    const count = await this.countUnread(userId);
    this.notificationGateway.notifyUnreadCount(userId, count);
    return result;
  }
}
