import { Module } from '@nestjs/common';
import { RecordsModule } from 'src/records/records.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';

@Module({
  imports: [RecordsModule],
  controllers: [AiController],
  providers: [AiService, OpenAIClient],
  exports: [AiService, OpenAIClient],
})
export class AiModule {}
