import { Module } from '@nestjs/common';
import { AndroidController } from './android.controller';
import { AndroidService } from './android.service';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TransfersModule],
  controllers: [AndroidController],
  providers: [AndroidService],
})
export class AndroidModule {}
