import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotTokenStrategy extends PassportStrategy(Strategy, 'bot-token') {
  constructor(private config: ConfigService) {
    super();
  }

  async validate(token: string) {
    if (token !== this.config.get('BOT_SERVICE_TOKEN')) {
      throw new UnauthorizedException('Invalid bot service token');
    }
    return { type: 'bot' };
  }
}
