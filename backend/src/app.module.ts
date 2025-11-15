import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BotModule } from './bot/bot.module';
import { AndroidModule } from './android/android.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BotModule,
    AndroidModule,
    UserModule,
    AdminModule,
    TransfersModule,
  ],
})
export class AppModule {}
