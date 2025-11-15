import { Module } from '@nestjs/common';
import { AndroidController } from './android.controller';
import { AndroidService } from './android.service';
import { TransfersModule } from '../transfers/transfers.module';
import { OperatorsModule } from '../operators/operators.module';

@Module({
  imports: [TransfersModule, OperatorsModule],
  controllers: [AndroidController],
  providers: [AndroidService],
})
export class AndroidModule {}
