import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RecommendationService } from './recommendation.service';
import { RecommendationCron } from './recommendation.cron';
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

  /** forDate는 @db.Date라서 시각 제거한 00:00 UTC로 정규화 */
  private todayDateOnly(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
