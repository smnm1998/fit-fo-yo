import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RecommendationService } from './recommendation.service';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAccessGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendation: RecommendationService) {}

  /** 오늘 추천 1건 */
  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.recommendation.getForDate(user.id, this.todayDateOnly());
  }

  /** 기간 조회 */
  @Get()
  getRange(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.recommendation.getRange(user.id, new Date(from), new Date(to));
  }

  /** forDate는 @db.Date라서 시각 제거한 00:00 UTC로 정규화 */
  private todayDateOnly(): Date {
    const KST = 9 * 60 * 60 * 1000;
    const k = new Date(Date.now() + KST);
    return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
  }
}
