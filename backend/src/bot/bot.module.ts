import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotClientService } from './bot-client.service';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TransfersModule],
  controllers: [BotController],
  providers: [BotService, BotClientService],
  exports: [BotClientService],
})
export class BotModule {}
