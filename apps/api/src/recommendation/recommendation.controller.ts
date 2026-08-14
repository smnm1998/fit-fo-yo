import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RecommendationService } from './recommendation.service';
import { RecommendationCron } from './recommendation.cron';
import { Throttle } from '@nestjs/throttler';
import { type AuthenticatedUser, CurrentUser } from 'src/auth/decorators/current-user.decorator';

@UseGuards(JwtAccessGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendation: RecommendationService,
    private readonly cron: RecommendationCron,
  ) {}

  /** 오늘 추천 1건 */
  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.recommendation.getForDate(user.id, this.todayDateOnly());
  }

  /** 기간 조회 (캘린더 뷰용) */
  @Get()
  getRange(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.recommendation.getRange(user.id, new Date(from), new Date(to));
  }

  @Post('run-now')
  @HttpCode(HttpStatus.OK)
  runNow() {
    return this.cron.runManually();
  }

  /** 현재 유저의 오늘 추천 즉시 생성(어제 기록 기반), 게스트 포함, runForAllUsers 우회 */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  generate(@CurrentUser() user: AuthenticatedUser) {
    return this.recommendation.generateForUser(user.id, this.todayDateOnly());
  }

  /** forDate는 @db.Date라서 시각 제거한 00:00 UTC로 정규화 */
  private todayDateOnly(): Date {
    const KST = 9 * 60 * 60 * 1000;
    const k = new Date(Date.now() + KST);
    return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
  }
}
