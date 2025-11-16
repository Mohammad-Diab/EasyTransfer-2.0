import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DeviceModule } from './device/device.module';
import { BotModule } from './bot/bot.module';
import { AndroidModule } from './android/android.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { TransfersModule } from './transfers/transfers.module';
import { OperatorsModule } from './operators/operators.module';
import { TasksModule } from './tasks/tasks.module';
import { BalanceModule } from './balance/balance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    DeviceModule,
    BotModule,
    AndroidModule,
    UserModule,
    AdminModule,
    TransfersModule,
    OperatorsModule,
    TasksModule,
    BalanceModule,
  ],
})
export class AppModule {}
