import { Global, Module } from '@nestjs/common';
import { SecurityService } from './services/security.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Global()
@Module({
  providers: [SecurityService, RateLimitGuard],
  exports: [SecurityService, RateLimitGuard],
})
export class CommonModule {}
