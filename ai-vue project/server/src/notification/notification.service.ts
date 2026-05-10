import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建通知
   */
  async create(data: {
    userId: number;
    type: string;
    title: string;
    content?: string;
    relatedId?: number;
  }) {
    return this.prisma.notification.create({ data });
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
   * 标记通知为已读
   */
  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: 1 },
    });
  }

  /**
   * 标记全部已读
   */
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: 0 },
      data: { isRead: 1 },
    });
  }
}
