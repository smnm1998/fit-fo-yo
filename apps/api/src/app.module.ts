import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppService } from './app.service';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { HealthProfileModule } from './health-profile/health-profile.module';
import { RecordsModule } from './records/records.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';
import { RecommendationModule } from './recommendation/recommendation.module';

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
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    // 3. 모듈
    AuthModule,
    PrismaModule,
    HealthModule,
    RecordsModule,
    AiModule,
    HealthProfileModule,
    RecommendationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 4. 요청 횟수 제한 모든 라우터에 자동 적용 (로그인한 요청은 사용자 단위, 아니면 IP 단위)
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
