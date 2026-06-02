import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class RecommendationCron {
  private readonly logger = new Logger(RecommendationCron.name);

  constructor(private readonly recommendation: RecommendationService) {}

  /** 매일 새벽 4시 KST — 어제 기록 기반으로 오늘 추천 생성 */
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'daily-recommendation',
    timeZone: 'Asia/Seoul',
  })
  async run(): Promise<void> {
    this.logger.log('일일 추천 정산 시작');
    await this.recommendation.runForAllUsers(new Date());
  }

  /** 수동 트리거 (개발/긴급) */
  async runManually(forDate?: Date) {
    return this.recommendation.runForAllUsers(forDate ?? new Date());
  }
}
