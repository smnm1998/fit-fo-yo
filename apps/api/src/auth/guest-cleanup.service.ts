import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GuestCleanupService {
  private readonly logger = new Logger(GuestCleanupService.name);
  private readonly GUEST_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'guest-cleanup',
    timeZone: 'Asia/Seoul',
  })
  async cleanupExpiredGuests(): Promise<void> {
    const cutoff = new Date(Date.now() - this.GUEST_TTL_MS);
    const result = await this.prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: { lt: cutoff },
      },
    });

    this.logger.log(
      `Guest cleanup: deleted ${result.count} expired guests (cutoff=${cutoff.toISOString()})`,
    );
  }

  //수동 트리거 (테스트/긴급 용도)
  async runManually(): Promise<{ deleted: number; cutoff: string }> {
    const cutoff = new Date(Date.now() - this.GUEST_TTL_MS);
    const result = await this.prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: { lt: cutoff },
      },
    });

    this.logger.log(`Manual guest cleanup: deleted ${result.count}`);
    return { deleted: result.count, cutoff: cutoff.toISOString() };
  }
}
