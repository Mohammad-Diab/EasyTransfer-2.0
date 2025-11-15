import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TransfersModule],
  providers: [TasksService],
})
export class TasksModule {}
