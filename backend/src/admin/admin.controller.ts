import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard/stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('users')
  async getAllUsers(@Query('page') page: string, @Query('limit') limit: string) {
    return this.adminService.getAllUsers(+page || 1, +limit || 20);
  }

  @Post('users/toggle-status')
  async toggleUserStatus(@Body() body: { user_id: number }) {
    return this.adminService.toggleUserStatus(body.user_id);
  }
}
