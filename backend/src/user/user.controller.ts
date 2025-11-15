import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('api/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('transfers')
  async getMyTransfers(@Request() req) {
    return this.userService.getMyTransfers(req.user.userId);
  }

  @Get('transfers/stats')
  async getMyStats(@Request() req) {
    return this.userService.getMyStats(req.user.userId);
  }
}
