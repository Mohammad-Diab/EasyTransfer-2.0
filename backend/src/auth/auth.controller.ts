import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyAndroidOtpDto } from './dto/verify-android-otp.dto';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/web/request-otp
   * Request OTP for Web login
   */
  @Post('web/request-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async requestWebOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestWebOtp(dto.phone);
    return {
      message: 'تم إرسال رمز التحقق عبر تيليغرام',
    };
  }

  /**
   * POST /api/auth/web/verify-otp
   * Verify OTP and get JWT token for Web (set as HTTP-only cookie)
   */
  @Post('web/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyWebOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyWebOtp(dto.phone, dto.code);
    
    // Set JWT token as HTTP-only cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Return user info without token
    return {
      user: result.user,
      message: 'تم تسجيل الدخول بنجاح',
    };
  }

  /**
   * POST /api/auth/android/request-otp
   * Request OTP for Android login
   */
  @Post('android/request-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async requestAndroidOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestAndroidOtp(dto.phone);
    return {
      success: true,
      message: 'تم إرسال رمز التحقق عبر تيليغرام',
    };
  }

  /**
   * POST /api/auth/android/verify-otp
   * Verify OTP and get JWT token for Android (includes device registration)
   */
  @Post('android/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyAndroidOtp(@Body() dto: VerifyAndroidOtpDto) {
    const result = await this.authService.verifyAndroidOtp(
      dto.phone,
      dto.code,
      dto.device_id,
      dto.device_name,
    );
    return {
      success: true,
      ...result,
    };
  }
}
