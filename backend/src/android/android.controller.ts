import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AndroidService } from './android.service';

@Controller('api/android')
// @UseGuards(AuthGuard('jwt'))
export class AndroidController {
  constructor(private androidService: AndroidService) {}

  @Get('jobs/pending')
  async getPendingJobs() {
    return this.androidService.getPendingJobs();
  }

  @Post('jobs/result')
  async reportResult(
    @Body() body: { request_id: number; status: string; carrier_response: string },
  ) {
    return this.androidService.reportResult(
      body.request_id,
      body.status,
      body.carrier_response,
    );
  }
}
