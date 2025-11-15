import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async createTransfer(userId: number, recipientPhone: string, amount: number) {
    // Business rules implementation
    // 1. Check 5-minute rule
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTransfer = await this.prisma.transferRequest.findFirst({
      where: {
        user_id: userId,
        recipient_phone: recipientPhone,
        created_at: { gte: fiveMinutesAgo },
      },
    });

    if (recentTransfer) {
      throw new Error('Cannot send to same recipient within 5 minutes');
    }

    // 2. Check 20-second rule
    const lastTransfer = await this.prisma.transferRequest.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    let status = 'pending';
    let executeAfter = new Date();

    if (lastTransfer && Date.now() - lastTransfer.created_at.getTime() < 20000) {
      status = 'delayed';
      executeAfter = new Date(lastTransfer.created_at.getTime() + 20000);
    }

    // 3. Detect operator
    const prefix = recipientPhone.substring(0, 3);
    const operatorPrefix = await this.prisma.operatorPrefix.findUnique({
      where: { prefix },
    });

    if (!operatorPrefix) {
      throw new Error('Invalid phone number');
    }

    // 4. Create transfer
    return this.prisma.transferRequest.create({
      data: {
        user_id: userId,
        recipient_phone: recipientPhone,
        amount,
        operator_code: operatorPrefix.operator_code,
        status: status as any,
        execute_after: executeAfter,
      },
    });
  }
}
