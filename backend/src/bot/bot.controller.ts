import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
}
