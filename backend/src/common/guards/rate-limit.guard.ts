import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 5; // 5 requests per minute per phone

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const phone = request.body?.phone;

    if (!phone) {
      // If no phone in request, allow (validation will catch it)
      return true;
    }

    const windowStart = new Date(Date.now() - this.WINDOW_MS);

    // Count OTP requests in the last minute for this phone
    // Find user by phone first, then count their OTP codes
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // If user doesn't exist, allow (auth service will handle)
      return true;
    }

    const recentRequests = await this.prisma.otpCode.count({
      where: {
        user_id: user.id,
        created_at: {
          gte: windowStart,
        },
      },
    });

    if (recentRequests >= this.MAX_REQUESTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'لقد تجاوزت الحد المسموح من المحاولات. يرجى المحاولة بعد دقيقة.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
