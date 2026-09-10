import { Module } from '@nestjs/common';
import { RecordsModule } from '../records/records.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { NutritionModule } from '../nutrition/nutrition.module';
import { HealthProfileModule } from '../health-profile/health-profile.module';

@Module({
  imports: [RecordsModule, NutritionModule, HealthProfileModule],
  controllers: [AiController],
  providers: [AiService, OpenAIClient],
  exports: [AiService, OpenAIClient],
})
export class AiModule {}
