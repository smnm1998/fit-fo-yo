import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { CurrentUser, type AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { HealthProfileService } from './health-profile.service';
import { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto';

@UseGuards(JwtAccessGuard)
@Controller('health-profile')
export class HealthProfileController {
  constructor(private readonly healthProfile: HealthProfileService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.healthProfile.get(user.id);
  }

  @Put()
  upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertHealthProfileDto) {
    return this.healthProfile.upsert(user.id, dto);
  }
}
