import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** 게스트 AI 사용 상한 (체험용), 초과 시 회원가입 유도 */
const GUEST_AI_LIMIT = 10;

type QuotaUser = { id: string; isGuest?: boolean };

/**
 * 게스트의 AI 사용 횟수 제한
 * 회원(isGuest=false/undefined)은 둘 다 no-op
 */
@Injectable()
export class GuestQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  /** 상한에 닿았으면 403 */
  async assertAvailable(user: QuotaUser): Promise<void> {
    if (!user.isGuest) return;
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { aiUsageCount: true },
    });
    if ((row?.aiUsageCount ?? 0) >= GUEST_AI_LIMIT) {
      throw new ForbiddenException(
        `게스트는 AI를 ${GUEST_AI_LIMIT}회까지 체험할 수 있어요. 회원가입하면 계속 사용할 수 있어요.`,
      );
    }
  }

  /** 사용 횟수 +1 */
  async consume(user: QuotaUser): Promise<void> {
    if (!user.isGuest) return;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { aiUsageCount: { increment: 1 } },
    });
  }
}
