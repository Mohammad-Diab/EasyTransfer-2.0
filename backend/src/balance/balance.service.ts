import { Injectable, Logger } from '@nestjs/common';

export interface BalanceJob {
  jobId: string;
  userId: number;
  telegramUserId: string;
  operator: 'syriatel' | 'mtn';
  status: 'pending' | 'processing' | 'completed';
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  private readonly balanceJobs = new Map<number, BalanceJob>(); // userId -> BalanceJob
  private readonly cleanupTimers = new Map<number, NodeJS.Timeout>(); // userId -> timeout
  private botClientService: any; // Lazy injection to avoid circular dependency

  /**
   * Set bot client service for notifications
   * Called from BalanceModule with forwardRef
   */
  setBotClientService(botClientService: any) {
    this.botClientService = botClientService;
  }

  /**
   * Create a new balance inquiry job for a user
   * Only one job per user at a time
   */
  createBalanceJob(
    userId: number,
    telegramUserId: string,
    operator: 'syriatel' | 'mtn',
  ): BalanceJob {
    // Cancel existing job if any
    this.cancelBalanceJob(userId);

    const jobId = `bal_${Date.now()}_${userId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    const job: BalanceJob = {
      jobId,
      userId,
      telegramUserId,
      operator,
      status: 'pending',
      createdAt: now,
      expiresAt,
    };

    this.balanceJobs.set(userId, job);

    // Set timeout for auto-cleanup and notification
    const timer = setTimeout(() => {
      this.handleJobTimeout(userId);
    }, 60 * 1000);

    this.cleanupTimers.set(userId, timer);

    this.logger.log(
      `Created balance job ${jobId} for user ${userId}, operator: ${operator}`,
    );

    return job;
  }

  /**
   * Get pending balance job for a user (for Android polling)
   */
  getPendingBalanceJob(userId: number): BalanceJob | null {
    const job = this.balanceJobs.get(userId);

    if (!job) {
      return null;
    }

    // Check if expired
    if (new Date() > job.expiresAt) {
      this.cancelBalanceJob(userId);
      return null;
    }

    // Only return if pending
    if (job.status === 'pending') {
      // Mark as processing
      job.status = 'processing';
      this.logger.log(`Balance job ${job.jobId} marked as processing`);
      return job;
    }

    return null;
  }

  /**
   * Complete a balance job (called when Android reports result)
   */
  completeBalanceJob(userId: number): BalanceJob | null {
    const job = this.balanceJobs.get(userId);

    if (!job) {
      this.logger.warn(`No balance job found for user ${userId}`);
      return null;
    }

    // Clear timeout
    const timer = this.cleanupTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(userId);
    }

    // Remove job
    this.balanceJobs.delete(userId);

    this.logger.log(`Balance job ${job.jobId} completed successfully`);

    return job;
  }

  /**
   * Cancel a balance job (cleanup)
   */
  cancelBalanceJob(userId: number): void {
    const job = this.balanceJobs.get(userId);

    if (!job) {
      return;
    }

    // Clear timeout
    const timer = this.cleanupTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(userId);
    }

    // Remove job
    this.balanceJobs.delete(userId);

    this.logger.log(`Balance job ${job.jobId} cancelled`);
  }

  /**
   * Handle job timeout - notify bot about failure
   */
  private async handleJobTimeout(userId: number): Promise<void> {
    const job = this.balanceJobs.get(userId);

    if (!job) {
      return;
    }

    this.logger.warn(
      `Balance job ${job.jobId} timed out after 60 seconds for user ${userId}`,
    );

    // Remove job
    this.balanceJobs.delete(userId);
    this.cleanupTimers.delete(userId);

    // Notify bot about timeout
    if (this.botClientService) {
      try {
        await this.botClientService.notifyBalanceResult(
          job.telegramUserId,
          'timeout',
          'انتهاء المهلة. لم يتم استلام أي رد خلال 60 ثانية.',
        );
      } catch (error) {
        this.logger.error(
          `Failed to notify bot about timeout for job ${job.jobId}:`,
          error.message,
        );
      }
    } else {
      this.logger.warn(
        'BotClientService not available - cannot send timeout notification',
      );
    }
  }

  /**
   * Get job statistics (for monitoring)
   */
  getStats(): { totalPending: number; totalProcessing: number } {
    let pending = 0;
    let processing = 0;

    for (const job of this.balanceJobs.values()) {
      if (job.status === 'pending') pending++;
      if (job.status === 'processing') processing++;
    }

    return { totalPending: pending, totalProcessing: processing };
  }
}
