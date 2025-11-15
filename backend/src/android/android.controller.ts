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
import { SubmitResultDto } from './dto/submit-result.dto';

@Controller('api/android')
@UseGuards(AuthGuard('jwt'))
export class AndroidController {
  constructor(
    private transfersService: TransfersService,
    private operatorsService: OperatorsService,
  ) {}

  /**
   * GET /api/android/requests/next
   * Poll for next pending transfer to execute
   */
  @Get('requests/next')
  async getNextRequest(@Request() req) {
    const deviceId = req.headers['x-device-id'] || 'dev-device';

    const transfer = await this.transfersService.getNextPendingTransfer(deviceId);

    if (!transfer) {
      return { message: 'No pending requests', request: null };
    }

    return { request: transfer };
  }

  /**
   * POST /api/android/requests/:id/result
   * Submit USSD execution result
   */
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
   * GET /api/android/rules
   * Get operator message rules for USSD response parsing
   * Android calls this on startup
   */
  @Get('rules')
  async getRules() {
    return this.operatorsService.getOperatorRules();
  }

  /**
   * GET /api/android/rules/last-updated
   * Check if rules have been updated since last fetch
   * Returns timestamp only for efficient cache checking
   */
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
