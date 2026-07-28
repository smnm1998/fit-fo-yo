import { Module } from '@nestjs/common';
import { RecordsModule } from 'src/records/records.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { NutritionModule } from '../nutrition/nutrition.module';

@Module({
  imports: [RecordsModule, NutritionModule],
  controllers: [AiController],
  providers: [AiService, OpenAIClient],
  exports: [AiService, OpenAIClient],
})
export class AiModule {}
