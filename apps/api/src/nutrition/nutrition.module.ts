import { Module } from '@nestjs/common';
import { MfdsClient } from './mfds.client';
import { NutritionService } from './nutrition.service';

@Module({
  providers: [NutritionService, MfdsClient],
  exports: [NutritionService],
})
export class NutritionModule {}
