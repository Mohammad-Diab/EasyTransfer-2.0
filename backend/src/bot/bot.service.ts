import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotService {
  constructor(private prisma: PrismaService) {}

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
    // Implementation will include business rules validation
    // - Check if user is authorized
    // - Apply 5-minute rule
    // - Apply 20-second rule
    // - Detect operator
    // - Create transfer request
    return { success: true };
  }
}
