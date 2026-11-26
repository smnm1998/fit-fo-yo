import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** 게스트 AI 사용 상한 (체험용), 초과 시 회원가입 유도 */
export const GUEST_AI_LIMIT = 10;

type QuotaUser = { id: string; isGuest?: boolean };

/**
 * 게스트의 AI 사용 횟수 제한
 * 회원(isGuest=false/undefined)은 그냥 실행
 */
@Injectable()
export class GuestQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1회를 먼저 잡아 두고 AI 호출을 실행, 호출이 실패하면 돌려준다
   * 확인(읽기)과 차감(쓰기)을 조건부 UPDATE 하나로 합쳐서, 동시 요청이 상한을 넘지 못하게 한다
   */
  async charge<T>(user: QuotaUser, call: () => Promise<T>): Promise<T> {
    if (!user.isGuest) return call();

    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, aiUsageCount: { lt: GUEST_AI_LIMIT } },
      data: { aiUsageCount: { increment: 1 } },
    });
    if (count === 0) {
      throw new ForbiddenException(
        `게스트는 AI를 ${GUEST_AI_LIMIT}회까지 체험할 수 있어요. 회원가입하면 계속 사용할 수 있어요.`,
      );
    }

    try {
      return await call();
    } catch (err) {
      await this.prisma.user.updateMany({
        where: { id: user.id, aiUsageCount: { gt: 0 } },
        data: { aiUsageCount: { decrement: 1 } },
      });
      throw err;
    }
  }
}
