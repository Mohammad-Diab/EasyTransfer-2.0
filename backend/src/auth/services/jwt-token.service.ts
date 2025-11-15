import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number; // user_id
  phone: string;
  role: string;
  type: 'web' | 'android';
}

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: NestJwtService,
    private config: ConfigService,
  ) {}

  /**
   * Generate JWT for Web (1-day expiration)
   */
  async generateWebToken(userId: number, phone: string, role: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      phone,
      role,
      type: 'web',
    };

    return this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_WEB_EXPIRATION') || '1d',
    });
  }

  /**
   * Generate JWT for Android (30-day expiration)
   */
  async generateAndroidToken(userId: number, phone: string, role: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      phone,
      role,
      type: 'android',
    };

    return this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ANDROID_EXPIRATION') || '30d',
    });
  }

  /**
   * Verify and decode JWT
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verify(token, {
      secret: this.config.get('JWT_SECRET'),
    });
  }
}
