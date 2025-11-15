import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeviceService } from './device.service';

@Controller('api/devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  /**
   * GET /api/devices
   * Get current user's device history
   */
  // @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMyDevices(@Request() req) {
    const userId = req.user?.sub || 1; // Temporary for development
    return this.deviceService.getUserDevices(userId);
  }

  /**
   * GET /api/devices/active
   * Get current user's active device
   */
  // @UseGuards(AuthGuard('jwt'))
  @Get('active')
  async getActiveDevice(@Request() req) {
    const userId = req.user?.sub || 1; // Temporary for development
    const device = await this.deviceService.getActiveDevice(userId);
    return { device };
  }

  /**
   * GET /api/devices/stats
   * Get device statistics for current user
   */
  // @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  async getMyDeviceStats(@Request() req) {
    const userId = req.user?.sub || 1; // Temporary for development
    return this.deviceService.getDeviceStats(userId);
  }

  /**
   * DELETE /api/devices/:deviceId
   * Revoke a device (user can revoke their own device)
   */
  // @UseGuards(AuthGuard('jwt'))
  @Delete(':deviceId')
  @HttpCode(HttpStatus.OK)
  async revokeMyDevice(@Param('deviceId') deviceId: string, @Request() req) {
    const userId = req.user?.sub || 1; // Temporary for development
    await this.deviceService.revokeDevice(deviceId, userId);
    return { message: 'Device revoked successfully' };
  }

  /**
   * GET /api/devices/user/:userId
   * Admin: Get all devices for a specific user
   */
  // @UseGuards(AuthGuard('jwt'))
  @Get('user/:userId')
  async getUserDevices(@Param('userId') userId: string, @Request() req) {
    const adminUserId = req.user?.sub || 1; // Temporary for development
    return this.deviceService.getDevicesByUserId(parseInt(userId), adminUserId);
  }

  /**
   * DELETE /api/devices/admin/:deviceId
   * Admin: Revoke any device
   */
  // @UseGuards(AuthGuard('jwt'))
  @Delete('admin/:deviceId')
  @HttpCode(HttpStatus.OK)
  async adminRevokeDevice(@Param('deviceId') deviceId: string) {
    await this.deviceService.adminRevokeDevice(deviceId);
    return { message: 'Device revoked successfully' };
  }
}
