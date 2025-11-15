import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Bot Client Service
 * 
 * Handles communication with the Telegram Bot's internal endpoints.
 * Used for sending OTPs and transfer notifications to users.
 */
@Injectable()
export class BotClientService {
  private readonly logger = new Logger(BotClientService.name);
  private readonly botInternalUrl: string;
  private readonly botInternalSecret: string;

  constructor(private config: ConfigService) {
    this.botInternalUrl = this.config.get<string>('BOT_INTERNAL_URL') || 'http://localhost:3100';
    this.botInternalSecret = this.config.get<string>('BOT_INTERNAL_SECRET');

    if (!this.botInternalSecret) {
      this.logger.warn('BOT_INTERNAL_SECRET not configured - bot communication will fail');
    }
  }

  /**
   * Send OTP code to user via Telegram
   */
  async sendOtp(telegramUserId: string, code: string): Promise<void> {
    try {
      const response = await fetch(`${this.botInternalUrl}/internal/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Secret': this.botInternalSecret,
        },
        body: JSON.stringify({
          telegram_user_id: telegramUserId,
          code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bot OTP delivery failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`OTP sent to user ${telegramUserId}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to user ${telegramUserId}:`, error.message);
      throw new Error('Failed to send OTP via Telegram');
    }
  }

  /**
   * Send transfer result notification to user via Telegram
   */
  async notifyTransferResult(
    telegramUserId: string,
    transferId: number,
    status: 'success' | 'failed',
    reason?: string,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.botInternalUrl}/internal/notify-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Secret': this.botInternalSecret,
        },
        body: JSON.stringify({
          telegram_user_id: telegramUserId,
          transfer_id: transferId,
          status,
          reason,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bot notification failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`Transfer notification sent to user ${telegramUserId} - Transfer ${transferId}: ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify user ${telegramUserId} about transfer ${transferId}:`,
        error.message,
      );
      // Don't throw - notification failure shouldn't break the transfer flow
    }
  }
}
