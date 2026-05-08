import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async paginate(dto: PaginationDto, keyword?: string) {
    const { currentPage = 1, size = 10 } = dto;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        skip: (currentPage - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { records, total, currentPage, size };
  }

  async updateStatus(id: number, status: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    // 不允许禁用最后一个管理员
    if (status === 0 && user.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin', status: 1 } });
      if (adminCount <= 1) {
        throw new ForbiddenException('不允许禁用最后一个管理员');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }
}
