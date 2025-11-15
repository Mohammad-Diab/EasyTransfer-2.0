import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { status: 'active' },
    });
    const totalTransfers = await this.prisma.transferRequest.count();
    const pendingTransfers = await this.prisma.transferRequest.count({
      where: { status: 'pending' },
    });
    const processingTransfers = await this.prisma.transferRequest.count({
      where: { status: 'processing' },
    });
    const successTransfers = await this.prisma.transferRequest.count({
      where: { status: 'success' },
    });
    const failedTransfers = await this.prisma.transferRequest.count({
      where: { status: 'failed' },
    });

    return {
      users: { total: totalUsers, active: activeUsers },
      transfers: {
        total: totalTransfers,
        pending: pendingTransfers,
        processing: processingTransfers,
        success: successTransfers,
        failed: failedTransfers,
      },
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    const total = await this.prisma.user.count();

    return { users, total, page, limit };
  }

  async toggleUserStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus as any },
    });
  }
}
