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
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransfersService } from '../transfers/transfers.service';

@Controller('api/android')
// @UseGuards(AuthGuard('jwt'))
export class AndroidController {
  constructor(private transfersService: TransfersService) {}

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
    @Param('id') id: string,
    @Body() body: { status: 'success' | 'failed'; carrier_response: string },
  ) {
    const transferId = parseInt(id);

    if (!body.status || !['success', 'failed'].includes(body.status)) {
      throw new BadRequestException('Invalid status. Must be "success" or "failed"');
    }

    if (!body.carrier_response) {
      throw new BadRequestException('carrier_response is required');
    }

    await this.transfersService.submitTransferResult(
      transferId,
      body.status,
      body.carrier_response,
    );

    return {
      message: 'Result submitted successfully',
      transfer_id: transferId,
      status: body.status,
    };
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
