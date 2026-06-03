import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationCron } from './recommendation.cron';

@Module({
  imports: [AiModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationCron],
  exports: [RecommendationService],
})
export class RecommendationModule {}
