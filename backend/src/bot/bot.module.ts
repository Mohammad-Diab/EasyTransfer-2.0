import { Module, forwardRef } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotClientService } from './bot-client.service';
import { TransfersModule } from '../transfers/transfers.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [forwardRef(() => TransfersModule), BalanceModule],
  controllers: [BotController],
  providers: [BotService, BotClientService],
  exports: [BotClientService],
})
export class BotModule {}
