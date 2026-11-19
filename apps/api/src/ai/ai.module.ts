import { Module } from '@nestjs/common';
import { RecordsModule } from '../records/records.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatAgentService } from './chat-agent.service';
import { GuestQuotaService } from './guest-quota.service';
import { RecordWriter } from './record.writer';
import { OpenAIClient } from './openai.client';
import { NutritionModule } from '../nutrition/nutrition.module';
import { HealthProfileModule } from '../health-profile/health-profile.module';

@Module({
  imports: [RecordsModule, NutritionModule, HealthProfileModule],
  controllers: [AiController],
  providers: [AiService, ChatAgentService, RecordWriter, GuestQuotaService, OpenAIClient],
  exports: [OpenAIClient],
})
export class AiModule {}
