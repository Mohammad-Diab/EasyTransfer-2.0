import { Controller, Get, Post, Put, Body, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private adminService: AdminService) {}

  // System-wide statistics
  @Get('dashboard/stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // User management endpoints
  @Get('users')
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    return this.adminService.getAllUsers(
      +page || 1,
      +limit || 20,
      search,
    );
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/toggle-status')
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserStatus(id);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users')
  async createUser(@Body() dto: { name: string; phone: string; telegram_user_id: number; otp: string }) {
    return this.adminService.createUser(dto);
  }

  @Post('users/verify-telegram')
  async verifyTelegramUser(@Body() dto: { telegram_user_id: number; phone: string }) {
    return this.adminService.verifyTelegramUser(dto);
  }

  @Post('users/request-otp')
  async requestUserOtp(@Body() dto: { telegram_user_id: number }) {
    return this.adminService.requestUserOtp(dto);
  }

  // Transfer management endpoints
  @Get('transfers')
  async getAllTransfers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('phone') phone: string,
  ) {
    return this.adminService.getAllTransfers(
      +page || 1,
      +limit || 20,
      status,
      phone,
    );
  }

  @Get('transfers/:id')
  async getTransferById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getTransferById(id);
  }

  // Device management endpoints
  @Get('devices')
  async getActiveDevices() {
    return this.adminService.getActiveDevices();
  }

  // System logs endpoint
  @Get('logs')
  async getSystemLogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.getSystemLogs(
      +page || 1,
      +limit || 50,
    );
  }
}
