import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  db: 'connected' | 'disconnected';
  timestamp: string;
};

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        db: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('DB health check failed', error);
      return {
        status: 'degraded',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
