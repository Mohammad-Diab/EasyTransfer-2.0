import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BotClientService } from '../bot/bot-client.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private botClient: BotClientService,
  ) {}

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Request OTP for Web login
   */
  async requestWebOtp(phone: string): Promise<{ message: string; code?: string }> {
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== 'active') {
      throw new BadRequestException('User account is inactive');
    }

    const code = this.generateOtpCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpCode.create({
      data: {
        user_id: user.id,
        code: hashedCode,
        purpose: 'web_login',
        expires_at: expiresAt,
      },
    });

    // Send OTP via Telegram bot
    await this.botClient.sendOtp(user.telegram_user_id.toString(), code);

    return { message: 'OTP sent to Telegram' };
  }

  /**
   * Verify OTP and return JWT for Web
   */
  async verifyWebOtp(phone: string, code: string): Promise<{ access_token: string; user: any }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        user_id: user.id,
        purpose: 'web_login',
        used_at: null,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otp || !(await bcrypt.compare(code, otp.code))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used_at: new Date() },
    });

    const access_token = await this.generateWebToken(user.id, user.phone, user.role);

    return {
      access_token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    };
  }

  /**
   * Request OTP for Android login
   */
  async requestAndroidOtp(phone: string): Promise<{ message: string; code?: string }> {
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) throw new BadRequestException('User not found');
    if (user.status !== 'active') throw new BadRequestException('User inactive');

    const code = this.generateOtpCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        user_id: user.id,
        code: hashedCode,
        purpose: 'android_login',
        expires_at: expiresAt,
      },
    });

    // Send OTP via Telegram bot
    await this.botClient.sendOtp(user.telegram_user_id.toString(), code);

    return { message: 'OTP sent to Telegram' };
  }

  /**
   * Verify OTP for Android (with device registration)
   */
  async verifyAndroidOtp(
    phone: string,
    code: string,
    deviceId: string,
    deviceName?: string,
  ): Promise<{ access_token: string; device_id: string; user: any }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        user_id: user.id,
        purpose: 'android_login',
        used_at: null,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otp || !(await bcrypt.compare(code, otp.code))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used_at: new Date() },
    });

    // One-device policy: revoke old devices
    await this.prisma.device.updateMany({
      where: { user_id: user.id, status: 'active' },
      data: { status: 'revoked' },
    });

    // Register new device
    const device = await this.prisma.device.create({
      data: {
        user_id: user.id,
        device_id: deviceId,
        device_name: deviceName,
        status: 'active',
        last_active: new Date(),
      },
    });

    const access_token = await this.generateAndroidToken(user.id, user.phone, user.role);

    return {
      access_token,
      device_id: device.device_id,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    };
  }

  async generateWebToken(userId: number, phone: string, role: string) {
    const payload = { sub: userId, phone, role, type: 'web' };
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_WEB_EXPIRATION') || '1d',
    });
  }

  async generateAndroidToken(userId: number, phone: string, role: string) {
    const payload = { sub: userId, phone, role, type: 'android' };
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('JWT_ANDROID_EXPIRATION') || '30d',
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
