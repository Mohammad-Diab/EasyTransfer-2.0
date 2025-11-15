import { Module } from '@nestjs/common';
import { AndroidController } from './android.controller';
import { AndroidService } from './android.service';

@Module({
  controllers: [AndroidController],
  providers: [AndroidService],
})
export class AndroidModule {}
