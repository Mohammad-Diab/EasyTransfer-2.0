import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
