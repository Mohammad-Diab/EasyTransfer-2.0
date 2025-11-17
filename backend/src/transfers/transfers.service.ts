import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotClientService } from '../bot/bot-client.service';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private botClient: BotClientService,
  ) {}

  /**
   * Detect operator from phone number prefix
   */
  private async detectOperator(phone: string): Promise<string> {
    // Extract first 3 digits as prefix
    const prefix = phone.substring(0, 3);

    const operatorPrefix = await this.prisma.operatorPrefix.findFirst({
      where: {
        prefix,
        is_active: true,
      },
    });

    if (!operatorPrefix) {
      throw new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم');
    }

    return operatorPrefix.operator_code;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): void {
    // Remove any spaces or special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Syrian phone numbers should be 10 digits starting with 09
    if (!/^09\d{8}$/.test(cleanPhone)) {
      throw new BadRequestException('يرجى إدخال رقم هاتف صحيح (مثال: 0912345678)');
    }
  }

  /**
   * Validate amount
   */
  private validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
      throw new BadRequestException('يجب أن يكون المبلغ أكبر من صفر');
    }

    if (amount > 100000) {
      throw new BadRequestException('المبلغ المطلوب يتجاوز الحد الأقصى المسموح (100,000)');
    }

    // Check if amount is integer
    if (!Number.isInteger(amount)) {
      throw new BadRequestException('يجب أن يكون المبلغ رقماً صحيحاً');
    }
  }

  /**
   * Check 5-minute same-recipient rule
   * Returns true if blocked, false if allowed
   */
  private async checkSameRecipientRule(
    userId: number,
    recipientPhone: string,
  ): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentTransfer = await this.prisma.transferRequest.findFirst({
      where: {
        user_id: userId,
        recipient_phone: recipientPhone,
        created_at: {
          gte: fiveMinutesAgo,
        },
      },
    });

    return !!recentTransfer;
  }

  /**
   * Check 20-second global cooldown
   * Returns the last transfer if within cooldown, null otherwise
   */
  private async checkGlobalCooldown(userId: number) {
    const twentySecondsAgo = new Date(Date.now() - 20 * 1000);

    const lastTransfer = await this.prisma.transferRequest.findFirst({
      where: {
        user_id: userId,
        created_at: {
          gte: twentySecondsAgo,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return lastTransfer;
  }

  /**
   * Calculate execute_after timestamp and initial status
   */
  private calculateExecutionTime(lastTransferTime?: Date): {
    status: 'delayed' | 'pending';
    execute_after: Date;
  } {
    if (!lastTransferTime) {
      return {
        status: 'pending',
        execute_after: new Date(),
      };
    }

    const now = Date.now();
    const lastTransferTimestamp = lastTransferTime.getTime();
    const timeSinceLastTransfer = now - lastTransferTimestamp;

    // If less than 20 seconds, delay the transfer
    if (timeSinceLastTransfer < 20 * 1000) {
      const executeAfter = new Date(lastTransferTimestamp + 20 * 1000);
      return {
        status: 'delayed',
        execute_after: executeAfter,
      };
    }

    return {
      status: 'pending',
      execute_after: new Date(),
    };
  }

  /**
   * Create a new transfer request (called from bot)
   */
  async createTransfer(
    userId: number,
    recipientPhone: string,
    amount: number,
  ): Promise<{
    id: number;
    status: string;
    execute_after: Date;
    message: string;
  }> {
    // Validate inputs
    this.validatePhoneNumber(recipientPhone);
    this.validateAmount(amount);

    // Get user and verify status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('حسابك غير نشط. يرجى التواصل مع الإدارة');
    }

    // Check 5-minute same-recipient rule (hard block)
    const isBlocked = await this.checkSameRecipientRule(userId, recipientPhone);
    if (isBlocked) {
      throw new BadRequestException(
        'لا يمكنك إرسال تحويل آخر لنفس المستلم خلال 5 دقائق',
      );
    }

    // Detect operator
    const operatorCode = await this.detectOperator(recipientPhone);

    // Check 20-second global cooldown
    const lastTransfer = await this.checkGlobalCooldown(userId);
    const { status, execute_after } = this.calculateExecutionTime(
      lastTransfer?.created_at,
    );

    // Create transfer request
    const transfer = await this.prisma.transferRequest.create({
      data: {
        user_id: userId,
        recipient_phone: recipientPhone,
        amount,
        operator_code: operatorCode,
        status,
        execute_after,
      },
    });

    // Check if user has an active device
    const activeDevice = await this.prisma.device.findFirst({
      where: {
        user_id: userId,
        status: 'active',
      },
    });

    // Prepare response message
    let message = 'تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.';
    
    if (!activeDevice) {
      message = 'تم استلام طلبك، سيتم التحويل عند ربط جهاز الأندرويد الخاص بك بحسابك.';
    } else if (status === 'delayed') {
      const delaySeconds = Math.ceil(
        (execute_after.getTime() - Date.now()) / 1000,
      );
      message = `تم استلام طلبك، وسيتم تنفيذ التحويل خلال ${delaySeconds} ثانية.`;
    }

    return {
      id: transfer.id,
      status: transfer.status,
      execute_after: transfer.execute_after,
      message,
    };
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(id: number) {
    const transfer = await this.prisma.transferRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new BadRequestException('الطلب غير موجود');
    }

    return transfer;
  }

  /**
   * Get transfers for a user
   */
  async getUserTransfers(
    userId: number,
    page: number = 1,
    limit: number = 20,
    status?: string,
    searchPhone?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
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
      }),
      this.prisma.transferRequest.count({ where }),
    ]);

    return {
      transfers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transfer statistics for a user
   */
  async getUserStats(userId: number) {
    const [total, pending, delayed, processing, success, failed] = await Promise.all([
      this.prisma.transferRequest.count({ where: { user_id: userId } }),
      this.prisma.transferRequest.count({ where: { user_id: userId, status: 'pending' } }),
      this.prisma.transferRequest.count({ where: { user_id: userId, status: 'delayed' } }),
      this.prisma.transferRequest.count({ where: { user_id: userId, status: 'processing' } }),
      this.prisma.transferRequest.count({ where: { user_id: userId, status: 'success' } }),
      this.prisma.transferRequest.count({ where: { user_id: userId, status: 'failed' } }),
    ]);

    return {
      total,
      pending,
      delayed,
      processing,
      success,
      failed,
    };
  }

  /**
   * Upgrade delayed transfers to pending when execute_after has passed
   * Called by Android polling endpoint
   */
  private async upgradeDelayedTransfers(): Promise<void> {
    await this.prisma.transferRequest.updateMany({
      where: {
        status: 'delayed',
        execute_after: {
          lte: new Date(),
        },
      },
      data: {
        status: 'pending',
      },
    });
  }

  /**
   * Get next pending transfer for Android to execute
   * Implements pessimistic locking to prevent double execution
   */
  async getNextPendingTransfer(deviceId: string): Promise<any> {
    // First, upgrade any delayed transfers that are ready
    await this.upgradeDelayedTransfers();

    // Use transaction for atomic operation
    return await this.prisma.$transaction(async (tx) => {
      // Find oldest pending transfer
      const transfer = await tx.transferRequest.findFirst({
        where: {
          status: 'pending',
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      if (!transfer) {
        return null;
      }

      // Lock it by changing status to processing
      await tx.transferRequest.update({
        where: { id: transfer.id },
        data: {
          status: 'processing',
        },
      });

      return {
        id: transfer.id,
        recipient_phone: transfer.recipient_phone,
        amount: transfer.amount,
        operator: transfer.operator_code,
      };
    });
  }

  /**
   * Submit transfer execution result from Android
   */
  async submitTransferResult(
    transferId: number,
    status: 'success' | 'failed',
    carrierResponse: string,
  ): Promise<void> {
    // Update transfer status
    await this.prisma.transferRequest.update({
      where: { id: transferId },
      data: {
        status,
        carrier_response: carrierResponse,
        executed_at: new Date(),
      },
    });

    // Get transfer with user info for notification
    const transfer = await this.prisma.transferRequest.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: {
            telegram_user_id: true,
            phone: true,
          },
        },
      },
    });

    if (transfer && transfer.user.telegram_user_id) {
      // Send notification to user via Telegram bot
      // For failed transfers, use carrier response as reason
      const failureReason = status === 'failed' ? carrierResponse : undefined;
      
      await this.botClient.notifyTransferResult(
        transfer.user.telegram_user_id.toString(),
        transfer.id,
        status,
        failureReason,
        transfer.amount,
        transfer.recipient_phone,
      );
    }
  }

  /**
   * Handle stale processing transfers (timeout after 5 minutes)
   */
  async handleStaleTransfers(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.prisma.transferRequest.updateMany({
      where: {
        status: 'processing',
        updated_at: {
          lte: fiveMinutesAgo,
        },
      },
      data: {
        status: 'failed',
        carrier_response: 'Transfer timed out - no response from device',
      },
    });

    return result.count;
  }

  /**
   * Get system-wide transfer statistics (for admin)
   */
  async getSystemStats() {
    const [total, pending, delayed, processing, success, failed] = await Promise.all([
      this.prisma.transferRequest.count(),
      this.prisma.transferRequest.count({ where: { status: 'pending' } }),
      this.prisma.transferRequest.count({ where: { status: 'delayed' } }),
      this.prisma.transferRequest.count({ where: { status: 'processing' } }),
      this.prisma.transferRequest.count({ where: { status: 'success' } }),
      this.prisma.transferRequest.count({ where: { status: 'failed' } }),
    ]);

    return {
      total,
      pending,
      delayed,
      processing,
      success,
      failed,
    };
  }

  /**
   * Get all transfers (for admin with pagination)
   */
  async getAllTransfers(
    page: number = 1,
    limit: number = 20,
    status?: string,
    searchPhone?: string,
  ) {
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

    return {
      transfers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
