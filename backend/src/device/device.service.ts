import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update device last_active timestamp
   * Called by middleware on authenticated Android requests
   */
  async updateLastActive(deviceId: string, userId: number): Promise<void> {
    await this.prisma.device.updateMany({
      where: {
        device_id: deviceId,
        user_id: userId,
        status: 'active',
      },
      data: {
        last_active: new Date(),
      },
    });
  }

  /**
   * Get user's device history
   */
  async getUserDevices(userId: number) {
    const devices = await this.prisma.device.findMany({
      where: { user_id: userId },
      orderBy: { last_active: 'desc' },
      select: {
        id: true,
        device_id: true,
        device_name: true,
        status: true,
        last_active: true,
        created_at: true,
      },
    });

    return { devices };
  }

  /**
   * Get active device for a user
   */
  async getActiveDevice(userId: number) {
    const device = await this.prisma.device.findFirst({
      where: {
        user_id: userId,
        status: 'active',
      },
      select: {
        id: true,
        device_id: true,
        device_name: true,
        status: true,
        last_active: true,
        created_at: true,
      },
    });

    return device;
  }

  /**
   * Revoke a device (user can revoke their own device)
   */
  async revokeDevice(deviceId: string, userId: number): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: {
        device_id: deviceId,
        user_id: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: { status: 'revoked' },
    });
  }

  /**
   * Admin: Get all devices for a specific user
   */
  async getDevicesByUserId(targetUserId: number, adminUserId: number) {
    // Verify admin role is checked by guard, this is just service logic
    const devices = await this.prisma.device.findMany({
      where: { user_id: targetUserId },
      orderBy: { last_active: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    return { devices };
  }

  /**
   * Admin: Revoke any device
   */
  async adminRevokeDevice(deviceId: string): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { device_id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: { status: 'revoked' },
    });
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(userId?: number) {
    const where = userId ? { user_id: userId } : {};

    const [total, active, revoked] = await Promise.all([
      this.prisma.device.count({ where }),
      this.prisma.device.count({ where: { ...where, status: 'active' } }),
      this.prisma.device.count({ where: { ...where, status: 'revoked' } }),
    ]);

    return {
      total,
      active,
      revoked,
    };
  }
}
