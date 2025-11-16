import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BotService } from './bot.service';
import { CreateTransferDto } from '../transfers/dto/create-transfer.dto';

@Controller('api/bot')
@UseGuards(AuthGuard('bot-token'))
export class BotController {
  constructor(private botService: BotService) {}

  @Post('authorize')
  async authorize(@Body() body: { telegram_user_id: number }) {
    return this.botService.authorizeUser(body.telegram_user_id);
  }

  @Post('transfers')
  async submitTransfer(
    @Body() body: { telegram_user_id: number } & CreateTransferDto,
  ) {
    return this.botService.submitTransfer(
      body.telegram_user_id,
      body.recipient_phone,
      body.amount,
    );
  }

  @Post('balance')
  async submitBalanceInquiry(
    @Body() body: { telegram_user_id: number; operator: 'syriatel' | 'mtn' },
  ) {
    return this.botService.submitBalanceInquiry(
      body.telegram_user_id,
      body.operator,
    );
  }

  @Get('health')
  async getHealth() {
    return this.botService.getHealthStatus();
  }
}
