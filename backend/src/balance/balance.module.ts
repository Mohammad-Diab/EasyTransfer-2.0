import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BotModule } from '../bot/bot.module';
import { ModuleRef } from '@nestjs/core';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule implements OnModuleInit {
  constructor(
    private balanceService: BalanceService,
    private moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // Lazy inject BotClientService to avoid circular dependency
    const { BotClientService } = await import('../bot/bot-client.service');
    const botClientService = this.moduleRef.get(BotClientService, {
      strict: false,
    });
    this.balanceService.setBotClientService(botClientService);
  }
}
