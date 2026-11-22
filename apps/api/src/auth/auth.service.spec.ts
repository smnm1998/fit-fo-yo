import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

describe('AuthService refresh 회전', () => {
  let service: AuthService;
  let storedHash: string | null;
  let now: number;
  let prisma: {
    user: { create: jest.Mock; update: jest.Mock; updateMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    storedHash = null;
    now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    // DB의 refreshTokenHash 한 칸을 흉내: updateMany는 where 해시가 맞을 때만 바꾼다
    prisma = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'u1',
          email: null,
          nickname: null,
          isGuest: true,
          createdAt: new Date(now),
        }),
        update: jest.fn(({ data }) => {
          storedHash = data.refreshTokenHash;
          return Promise.resolve({});
        }),
        updateMany: jest.fn(({ where, data }) => {
          if (where.refreshTokenHash !== storedHash) return Promise.resolve({ count: 0 });
          storedHash = data.refreshTokenHash;
          return Promise.resolve({ count: 1 });
        }),
        findUnique: jest.fn().mockResolvedValue({ isGuest: true }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: {} },
        { provide: JwtService, useValue: new JwtService({ secret: 'test-access' }) },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-refresh', get: () => undefined },
        },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  const login = async () => (await service.issueGuest()).tokens.refreshToken;

  it('refresh 토큰은 refresh 전용 secret으로 서명한다', async () => {
    const t0 = await login();
    const jwt = new JwtService();

    expect(() => jwt.verify(t0, { secret: 'test-refresh' })).not.toThrow();
    expect(() => jwt.verify(t0, { secret: 'test-access' })).toThrow();
  });

  it('현재 토큰이면 새 토큰을 주고 저장 해시를 바꾼다', async () => {
    const t0 = await login();
    const { refreshToken: t1 } = await service.refresh('u1', t0);

    expect(t1).not.toBe(t0);
    expect(storedHash).toBe(sha256(t1));
  });

  it('회전으로 밀려난 옛 토큰은 유예 시간이 지나면 거부한다', async () => {
    const t0 = await login();
    const { refreshToken: t1 } = await service.refresh('u1', t0);
    now += 10_001;

    await expect(service.refresh('u1', t0)).rejects.toThrow(UnauthorizedException);
    await expect(service.refresh('u1', t1)).resolves.toBeDefined();
  });

  it('같은 토큰으로 동시에 오면 한 번만 회전하고 같은 토큰을 준다', async () => {
    const t0 = await login();
    const [a, b] = await Promise.all([service.refresh('u1', t0), service.refresh('u1', t0)]);

    expect(a).toEqual(b);
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
    expect(storedHash).toBe(sha256(a.refreshToken));
  });

  it('로그아웃한 토큰은 거부한다', async () => {
    const t0 = await login();
    await service.logout('u1', t0);

    expect(storedHash).toBeNull();
    await expect(service.refresh('u1', t0)).rejects.toThrow(UnauthorizedException);
  });

  it('로그아웃하면 유예 중인 옛 토큰도 거부한다', async () => {
    const t0 = await login();
    const { refreshToken: t1 } = await service.refresh('u1', t0);
    await service.logout('u1', t1);

    await expect(service.refresh('u1', t0)).rejects.toThrow(UnauthorizedException);
  });

  it('지금 세션이 아닌 토큰으로 로그아웃하면 지금 세션은 그대로 둔다', async () => {
    const t0 = await login();
    const { refreshToken: t1 } = await service.refresh('u1', t0);
    now += 10_001;
    await service.logout('u1', t0);

    expect(storedHash).toBe(sha256(t1));
  });
});
