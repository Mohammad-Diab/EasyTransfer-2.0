import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { DeviceActivityMiddleware } from './device-activity.middleware';

@Module({
  providers: [DeviceService],
  controllers: [DeviceController],
  exports: [DeviceService],
})
export class DeviceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to all routes except auth endpoints
    consumer
      .apply(DeviceActivityMiddleware)
      .exclude('api/auth/(.*)')
      .forRoutes('*');
  }
}
