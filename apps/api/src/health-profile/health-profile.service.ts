import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto';

@Injectable()
export class HealthProfileService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.healthProfile.findUnique({ where: { userId } });
  }

  upsert(userId: string, dto: UpsertHealthProfileDto) {
    return this.prisma.healthProfile.upsert({
      where: { userId },
      create: { user: { connect: { id: userId } }, ...dto },
      update: { ...dto },
    });
  }
}
