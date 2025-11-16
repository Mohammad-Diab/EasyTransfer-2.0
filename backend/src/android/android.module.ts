import { Module, forwardRef } from '@nestjs/common';
import { AndroidController } from './android.controller';
import { AndroidService } from './android.service';
import { TransfersModule } from '../transfers/transfers.module';
import { OperatorsModule } from '../operators/operators.module';
import { BalanceModule } from '../balance/balance.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    TransfersModule,
    OperatorsModule,
    BalanceModule,
    forwardRef(() => BotModule),
  ],
  controllers: [AndroidController],
  providers: [AndroidService],
})
export class AndroidModule {}
