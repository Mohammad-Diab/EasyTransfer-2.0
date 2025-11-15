import { Module, forwardRef } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
