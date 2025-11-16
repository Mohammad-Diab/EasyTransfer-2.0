import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMyTransfers(userId: number) {
    return this.prisma.transferRequest.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMyStats(userId: number) {
    const total = await this.prisma.transferRequest.count({
      where: { user_id: userId },
    });
    const pending = await this.prisma.transferRequest.count({
      where: { user_id: userId, status: 'pending' },
    });
    const processing = await this.prisma.transferRequest.count({
      where: { user_id: userId, status: 'processing' },
    });
    const success = await this.prisma.transferRequest.count({
      where: { user_id: userId, status: 'success' },
    });
    const failed = await this.prisma.transferRequest.count({
      where: { user_id: userId, status: 'failed' },
    });

    return { total, pending, processing, success, failed };
  }

  async getUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegram_user_id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
  }
}
