import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { UserThrottlerGuard, bearerSubject } from './user-throttler.guard';

/** 서명 없는 JWT 모양 문자열 (가드는 sub만 읽는다) */
function token(sub: string): string {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'HS256' })}.${part({ sub })}.sig`;
}

describe('bearerSubject', () => {
  it('Bearer 토큰의 sub를 읽는다', () => {
    expect(bearerSubject({ authorization: `Bearer ${token('u1')}` })).toBe('u1');
  });

  it('토큰이 없거나 형식이 다르면 null', () => {
    expect(bearerSubject({})).toBeNull();
    expect(bearerSubject(undefined)).toBeNull();
    expect(bearerSubject({ authorization: 'Basic abc' })).toBeNull();
    expect(bearerSubject({ authorization: 'Bearer not-a-jwt' })).toBeNull();
    expect(bearerSubject({ authorization: 'Bearer a.%%%.c' })).toBeNull();
  });
});

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return 'ok';
  }
}

describe('UserThrottlerGuard (분당 2회로 줄여 실제 요청으로 확인)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 2 }])],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: UserThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    (app as unknown as NestExpressApplication).set('trust proxy', 1); // main.ts와 같은 설정
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  /** 같은 조건으로 3번 보내고 상태 코드들 */
  async function thrice(headers: Record<string, string>): Promise<number[]> {
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await request(app.getHttpServer()).get('/ping').set(headers);
      statuses.push(res.status);
    }
    return statuses;
  }

  it('토큰 없는 요청은 IP 단위로 센다', async () => {
    await expect(thrice({})).resolves.toEqual([200, 200, 429]);
  });

  it('같은 IP라도 사용자마다 칸이 따로다 (BFF 하나를 여러 사용자가 거쳐 와도)', async () => {
    await expect(thrice({ authorization: `Bearer ${token('a')}` })).resolves.toEqual([
      200, 200, 429,
    ]);
    await expect(thrice({ authorization: `Bearer ${token('b')}` })).resolves.toEqual([
      200, 200, 429,
    ]);
  });

  it('X-Forwarded-For 앞쪽을 바꿔 지어내도 프록시가 붙인 마지막 IP가 같으면 같은 칸이다', async () => {
    const statuses: number[] = [];
    for (const forged of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
      const res = await request(app.getHttpServer())
        .get('/ping')
        .set('X-Forwarded-For', `${forged}, 203.0.113.7`);
      statuses.push(res.status);
    }
    expect(statuses).toEqual([200, 200, 429]);
  });

  it('프록시가 붙인 접속 IP가 다르면 다른 칸이다', async () => {
    await expect(thrice({ 'X-Forwarded-For': '203.0.113.7' })).resolves.toEqual([200, 200, 429]);
    await expect(thrice({ 'X-Forwarded-For': '203.0.113.8' })).resolves.toEqual([200, 200, 429]);
  });
});
