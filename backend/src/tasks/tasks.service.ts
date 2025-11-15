import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransfersService } from '../transfers/transfers.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private transfersService: TransfersService) {}

  /**
   * Run every minute to check for stale transfers
   * Marks transfers as failed if they've been in processing state for > 5 minutes
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleStaleTransfers() {
    try {
      const count = await this.transfersService.handleStaleTransfers();
      if (count > 0) {
        this.logger.warn(`Marked ${count} stale transfer(s) as failed`);
      }
    } catch (error) {
      this.logger.error('Error handling stale transfers:', error);
    }
  }
}
