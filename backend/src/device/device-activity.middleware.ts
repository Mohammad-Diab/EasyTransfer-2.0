import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DeviceService } from './device.service';

@Injectable()
export class DeviceActivityMiddleware implements NestMiddleware {
  constructor(private deviceService: DeviceService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if user is authenticated and has device_id in headers
    const user = (req as any).user;
    const deviceId = req.headers['x-device-id'] as string;

    if (user && deviceId) {
      try {
        // Update last_active timestamp asynchronously
        this.deviceService.updateLastActive(deviceId, user.sub).catch((err) => {
          console.error('Failed to update device last_active:', err);
        });
      } catch (error) {
        // Don't block the request if update fails
        console.error('Device activity middleware error:', error);
      }
    }

    next();
  }
}
