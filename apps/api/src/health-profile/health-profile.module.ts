import { Module } from '@nestjs/common';
import { HealthProfileController } from './health-profile.controller';
import { HealthProfileService } from './health-profile.service';

@Module({
  controllers: [HealthProfileController],
  providers: [HealthProfileService],
  exports: [HealthProfileService],
})
export class HealthProfileModule {}
