import { Module } from '@nestjs/common';
import { TiersService } from './tiers.service';
import { TiersController } from './tiers.controller';

@Module({
  providers: [TiersService],
  controllers: [TiersController],
  exports: [TiersService],
})
export class TiersModule {}
