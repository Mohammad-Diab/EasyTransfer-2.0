import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransfersService } from '../transfers/transfers.service';
import { UserService } from './user.service';

@Controller('api/me')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    private transfersService: TransfersService,
    private userService: UserService,
  ) {}

  /**
   * GET /api/me/summary
   * Get user summary with statistics
   */
  @Get('summary')
  async getSummary(@Request() req) {
    const userId = req.user?.userId; // Get from JWT payload

    const [user, stats] = await Promise.all([
      this.userService.getUserById(userId),
      this.transfersService.getUserStats(userId),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Convert BigInt to string for JSON serialization
    const userResponse = {
      ...user,
      telegram_user_id: user.telegram_user_id?.toString(),
    };

    return {
      ...userResponse,
      statistics: stats,
    };
  }

  /**
   * GET /api/me/transfers
   * Get user's transfers with pagination, filtering, and search
   */
  @Get('transfers')
  async getMyTransfers(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('phone') phone?: string,
  ) {
    const userId = req.user?.userId;
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '20');

    // Validate pagination parameters
    const validatedPage = Math.max(1, pageNum);
    const validatedLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 per page

    const result = await this.transfersService.getUserTransfers(
      userId,
      validatedPage,
      validatedLimit,
      status,
      phone,
    );

    return result;
  }

  /**
   * GET /api/me/transfers/stats
   * Get user's transfer statistics
   */
  @Get('transfers/stats')
  async getMyStats(@Request() req) {
    const userId = req.user?.userId;
    return this.transfersService.getUserStats(userId);
  }
}
