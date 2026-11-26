import { ForbiddenException } from '@nestjs/common';
import { GUEST_AI_LIMIT, GuestQuotaService } from './guest-quota.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('GuestQuotaService.charge', () => {
  let prisma: { user: { updateMany: jest.Mock } };
  let quota: GuestQuotaService;
  const guest = { id: 'g1', isGuest: true };

  beforeEach(() => {
    prisma = { user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    quota = new GuestQuotaService(prisma as unknown as PrismaService);
  });

  it('상한 아래면 1회를 조건부 UPDATE로 잡은 뒤 AI를 호출한다.', async () => {
    const call = jest.fn().mockResolvedValue('ok');

    await expect(quota.charge(guest, call)).resolves.toBe('ok');

    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'g1', aiUsageCount: { lt: GUEST_AI_LIMIT } },
      data: { aiUsageCount: { increment: 1 } },
    });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('상한에 닿았으면(갱신 0건) 403이고 AI를 호출하지 않는다.', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    const call = jest.fn();

    await expect(quota.charge(guest, call)).rejects.toThrow(ForbiddenException);
    expect(call).not.toHaveBeenCalled();
  });

  it('AI 호출이 실패하면 잡아 둔 1회를 돌려주고 에러를 그대로 던진다.', async () => {
    const boom = new Error('openai down');

    await expect(quota.charge(guest, () => Promise.reject(boom))).rejects.toBe(boom);

    expect(prisma.user.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'g1', aiUsageCount: { gt: 0 } },
      data: { aiUsageCount: { decrement: 1 } },
    });
  });

  it('회원은 횟수를 건드리지 않고 바로 호출한다.', async () => {
    const call = jest.fn().mockResolvedValue('ok');

    await expect(quota.charge({ id: 'u1', isGuest: false }, call)).resolves.toBe('ok');
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
