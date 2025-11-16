import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TiersService, TierValidationResult } from './tiers.service';

@Controller('api/bot')
@UseGuards(AuthGuard('bot-token'))
export class TiersController {
  constructor(private tiersService: TiersService) {}

  @Post('validate-amount')
  async validateAmount(
    @Body() body: { amount: number },
  ): Promise<TierValidationResult> {
    return this.tiersService.validateAmount(body.amount);
  }
}
