import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // System-wide statistics for admin dashboard
  async getSystemStats() {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'inactive' } }),
    ]);

    const [totalTransfers, pendingTransfers, delayedTransfers, processingTransfers, successTransfers, failedTransfers] = await Promise.all([
      this.prisma.transferRequest.count(),
      this.prisma.transferRequest.count({ where: { status: 'pending' } }),
      this.prisma.transferRequest.count({ where: { status: 'delayed' } }),
      this.prisma.transferRequest.count({ where: { status: 'processing' } }),
      this.prisma.transferRequest.count({ where: { status: 'success' } }),
      this.prisma.transferRequest.count({ where: { status: 'failed' } }),
    ]);

    const totalDevices = await this.prisma.device.count();
    const activeDevices = await this.prisma.device.count({ where: { status: 'active' } });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      transfers: {
        total: totalTransfers,
        pending: pendingTransfers,
        delayed: delayedTransfers,
        processing: processingTransfers,
        success: successTransfers,
        failed: failedTransfers,
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
      },
    };
  }

  // Get all users with pagination and optional search
  async getAllUsers(page: number = 1, limit: number = 20, searchQuery?: string) {
    // Enforce max page size
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    // Search by phone number or name
    if (searchQuery) {
      where.OR = [
        { phone: { contains: searchQuery } },
        { name: { contains: searchQuery } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          status: true,
          telegram_user_id: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              transfer_requests: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Add transfer statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [successCount, failedCount] = await Promise.all([
          this.prisma.transferRequest.count({
            where: { user_id: user.id, status: 'success' },
          }),
          this.prisma.transferRequest.count({
            where: { user_id: user.id, status: 'failed' },
          }),
        ]);

        return {
          ...user,
          total_transfers: user._count.transfer_requests,
          successful_transfers: successCount,
          failed_transfers: failedCount,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      users: usersWithStats,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get single user by ID with full details
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        transfer_requests: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  // Toggle user active/inactive status
  async toggleUserStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus as any },
    });
  }

  // Update user details (name, role)
  async updateUser(userId: number, updateData: { name?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.role && { role: updateData.role as any }),
      },
    });
  }

  // Get all transfers with pagination and filtering (system-wide)
  async getAllTransfers(
    page: number = 1,
    limit: number = 20,
    status?: string,
    searchPhone?: string,
  ) {
    // Enforce max page size
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (searchPhone) {
      where.recipient_phone = { contains: searchPhone };
    }

    const [transfers, total] = await Promise.all([
      this.prisma.transferRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.transferRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      transfers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get transfer details by ID
  async getTransferById(transferId: number) {
    const transfer = await this.prisma.transferRequest.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            telegram_user_id: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('طلب التحويل غير موجود');
    }

    return transfer;
  }

  // Get all active devices
  async getActiveDevices() {
    return this.prisma.device.findMany({
      where: { status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
      orderBy: { last_active: 'desc' },
    });
  }

  // Get system logs with pagination
  async getSystemLogs(page: number = 1, limit: number = 50) {
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.systemLog.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Verify Telegram user exists and matches phone
  async verifyTelegramUser(dto: { telegram_user_id: number; phone: string }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { telegram_user_id: dto.telegram_user_id },
    });

    if (existingUser) {
      throw new BadRequestException('هذا المستخدم مسجل بالفعل في النظام');
    }

    // Check if phone is already used
    const phoneExists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (phoneExists) {
      throw new BadRequestException('رقم الهاتف مستخدم بالفعل');
    }

    return { valid: true };
  }

  // Create new user
  async createUser(dto: { name: string; phone: string; telegram_user_id: number; otp: string }) {
    // Verify OTP via bot
    // This should call the bot's internal API to verify OTP
    // For now, we'll create the user directly
    // TODO: Implement OTP verification with bot

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { telegram_user_id: dto.telegram_user_id },
    });

    if (existingUser) {
      throw new BadRequestException('هذا المستخدم مسجل بالفعل');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        telegram_user_id: dto.telegram_user_id,
        role: 'USER',
        status: 'active',
      },
    });

    return user;
  }
}
