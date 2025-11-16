import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransfersService } from '../transfers/transfers.service';
import { BalanceService } from '../balance/balance.service';
import { MESSAGES } from '../common/constants/messages';

@Injectable()
export class BotService {
  constructor(
    private prisma: PrismaService,
    private transfersService: TransfersService,
    private balanceService: BalanceService,
  ) {}

  async authorizeUser(telegramUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { telegram_user_id: telegramUserId },
    });

    return {
      allowed: user !== null && user.status === 'active',
      user_id: user?.id,
    };
  }

  async submitTransfer(telegramUserId: number, phone: string, amount: number) {
    // Get user from telegram_user_id
    const user = await this.prisma.user.findUnique({
      where: { telegram_user_id: telegramUserId },
    });

    if (!user) {
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(MESSAGES.ACCOUNT_DISABLED);
    }

    // Use TransfersService to create transfer with all business rules
    return this.transfersService.createTransfer(user.id, phone, amount);
  }

  async submitBalanceInquiry(
    telegramUserId: number,
    operator: 'syriatel' | 'mtn',
  ) {
    // Get user from telegram_user_id
    const user = await this.prisma.user.findUnique({
      where: { telegram_user_id: telegramUserId },
    });

    if (!user) {
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(MESSAGES.ACCOUNT_DISABLED);
    }

    // Create in-memory balance job
    const job = this.balanceService.createBalanceJob(
      user.id,
      telegramUserId.toString(),
      operator,
    );

    return {
      job_id: job.jobId,
      status: 'pending',
      message: 'Balance inquiry job created',
    };
  }

  async getHealthStatus() {
    // Get active devices
    const activeDevices = await this.prisma.device.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        device_id: true,
        last_active: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return {
      backend: {
        status: 'online',
        timestamp: new Date().toISOString(),
      },
      devices: {
        connected: activeDevices.length > 0,
        count: activeDevices.length,
        devices: activeDevices.map(device => ({
          id: device.id,
          device_id: device.device_id,
          last_active: device.last_active,
          user: device.user?.name || device.user?.phone || 'Unknown',
        })),
      },
    };
  }
}
