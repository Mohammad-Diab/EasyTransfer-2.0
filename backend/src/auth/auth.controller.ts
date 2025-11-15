import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Web and Android login endpoints will be implemented here
}
