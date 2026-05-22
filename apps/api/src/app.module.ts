import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // 1. env 로드 + 전역 ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),

    // 2. Rate Limiting (글로벌 + AI 전용)
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 }, // 분당 100회
    ]),

    // 3. 모듈
    AuthModule,
    PrismaModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 4. ThrottlerGuard 모든 라우터에 자동 적용
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
