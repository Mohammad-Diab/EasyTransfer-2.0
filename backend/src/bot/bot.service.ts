import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransfersService } from '../transfers/transfers.service';

@Injectable()
export class BotService {
  constructor(
    private prisma: PrismaService,
    private transfersService: TransfersService,
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

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('عذراً، لا تملك صلاحية استخدام هذا البوت.');
    }

    // Use TransfersService to create transfer with all business rules
    return this.transfersService.createTransfer(user.id, phone, amount);
  }
}
