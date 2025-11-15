import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BotTokenStrategy } from './strategies/bot-token.strategy';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    PassportModule,
    BotModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_WEB_EXPIRATION') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, BotTokenStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
