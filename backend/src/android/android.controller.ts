import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransfersService } from '../transfers/transfers.service';
import { OperatorsService } from '../operators/operators.service';
import { BalanceService } from '../balance/balance.service';
import { BotClientService } from '../bot/bot-client.service';
import { SubmitResultDto } from './dto/submit-result.dto';

@Controller('api/android')
export class AndroidController {
  constructor(
    private transfersService: TransfersService,
    private operatorsService: OperatorsService,
    private balanceService: BalanceService,
    private botClientService: BotClientService,
  ) {}

  /**
   * GET /api/android/requests/next
   * Poll for next pending job (balance or transfer)
   * Balance jobs have priority over transfer jobs
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('requests/next')
  async getNextRequest(@Request() req) {
    const userId = req.user.userId;
    const deviceId = req.headers['x-device-id'] || 'dev-device';

    // Check for pending balance job first (higher priority)
    const balanceJob = this.balanceService.getPendingBalanceJob(userId);
    if (balanceJob) {
      return {
        job_type: 'balance',
        job_id: balanceJob.jobId,
        operator: balanceJob.operator,
      };
    }

    // Fall back to transfer jobs
    const transfer = await this.transfersService.getNextPendingTransfer(deviceId);
    if (!transfer) {
      return { message: 'No pending requests', request: null };
    }

    return { job_type: 'transfer', request: transfer };
  }

  /**
   * POST /api/android/requests/:id/result
   * Submit USSD execution result
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('requests/:id/result')
  @HttpCode(HttpStatus.OK)
  async submitResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitResultDto,
  ) {
    await this.transfersService.submitTransferResult(
      id,
      dto.status,
      dto.carrier_response,
    );

    return {
      message: 'Result submitted successfully',
      transfer_id: id,
      status: dto.status,
    };
  }

  /**
   * POST /api/android/balance/result
   * Submit balance inquiry USSD result
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('balance/result')
  @HttpCode(HttpStatus.OK)
  async submitBalanceResult(
    @Request() req,
    @Body() dto: { status: 'success' | 'failed'; message: string },
  ) {
    const userId = req.user.userId;

    // Complete the balance job
    const completedJob = this.balanceService.completeBalanceJob(userId);

    if (!completedJob) {
      return {
        error: 'No active balance job found',
      };
    }

    // Notify bot with result
    await this.botClientService.notifyBalanceResult(
      completedJob.telegramUserId,
      dto.status,
      dto.message,
    );

    return {
      message: 'Balance result submitted successfully',
      job_id: completedJob.jobId,
      status: dto.status,
    };
  }

  /**
   * GET /api/android/rules
   * Get operator message rules for USSD response parsing
   * Android calls this on startup
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('rules')
  async getRules() {
    return this.operatorsService.getOperatorRules();
  }

  /**
   * GET /api/android/rules/last-updated
   * Check if rules have been updated since last fetch
   * Returns timestamp only for efficient cache checking
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('rules/last-updated')
  async getRulesLastUpdated() {
    return this.operatorsService.getRulesLastUpdated();
  }

  /**
   * GET /api/android/health
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return { status: 'ok', timestamp: new Date() };
  }
}
