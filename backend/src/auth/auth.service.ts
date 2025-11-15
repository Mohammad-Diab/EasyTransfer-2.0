import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async generateWebToken(userId: number) {
    const payload = { sub: userId, type: 'web' };
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_WEB_EXPIRATION'),
    });
  }

  async generateAndroidToken(userId: number) {
    const payload = { sub: userId, type: 'android' };
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_ANDROID_EXPIRATION'),
    });
  }

  async validateBotToken(token: string): Promise<boolean> {
    return token === this.config.get('BOT_SERVICE_TOKEN');
  }

  async generateOTP(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async saveOTP(userId: number, code: string, purpose: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpCode.create({
      data: {
        user_id: userId,
        code,
        purpose: purpose as any,
        expires_at: expiresAt,
      },
    });
  }

  async verifyOTP(userId: number, code: string, purpose: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        user_id: userId,
        code,
        purpose: purpose as any,
        used_at: null,
        expires_at: { gte: new Date() },
      },
    });

    if (!otp) return false;

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used_at: new Date() },
    });

    return true;
  }
}
