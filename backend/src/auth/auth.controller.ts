import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/web/request-otp
   * Request OTP for Web login
   */
  @Post('web/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestWebOtp(@Body() body: { phone: string }) {
    return this.authService.requestWebOtp(body.phone);
  }

  /**
   * POST /api/auth/web/verify-otp
   * Verify OTP and get JWT token for Web
   */
  @Post('web/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyWebOtp(@Body() body: { phone: string; code: string }) {
    return this.authService.verifyWebOtp(body.phone, body.code);
  }

  /**
   * POST /api/auth/android/request-otp
   * Request OTP for Android login
   */
  @Post('android/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestAndroidOtp(@Body() body: { phone: string }) {
    return this.authService.requestAndroidOtp(body.phone);
  }

  /**
   * POST /api/auth/android/verify-otp
   * Verify OTP and get JWT token for Android (includes device registration)
   */
  @Post('android/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyAndroidOtp(
    @Body() body: { phone: string; code: string; device_id: string; device_name?: string },
  ) {
    return this.authService.verifyAndroidOtp(
      body.phone,
      body.code,
      body.device_id,
      body.device_name,
    );
  }
}
