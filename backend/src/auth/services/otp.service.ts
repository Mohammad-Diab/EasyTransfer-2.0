import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a 6-digit OTP code
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and store OTP for a user
   */
  async createOtp(
    userId: number,
    purpose: 'web_login' | 'android_login',
  ): Promise<string> {
    const code = this.generateCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpCode.create({
      data: {
        user_id: userId,
        code: hashedCode,
        purpose,
        expires_at: expiresAt,
      },
    });

    return code; // Return plain code for delivery
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(
    userId: number,
    code: string,
    purpose: 'web_login' | 'android_login',
  ): Promise<boolean> {
    // Find the most recent unused OTP
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        user_id: userId,
        purpose,
        used_at: null,
        expires_at: {
          gte: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!otp) {
      return false;
    }

    // Verify code
    const isValid = await bcrypt.compare(code, otp.code);

    if (isValid) {
      // Mark as used
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { used_at: new Date() },
      });
    }

    return isValid;
  }

  /**
   * Clean up expired OTPs (optional, can be run periodically)
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.prisma.otpCode.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}
