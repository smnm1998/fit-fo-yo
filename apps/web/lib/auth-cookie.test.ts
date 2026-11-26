import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import { ACCESS_COOKIE, REFRESH_COOKIE, writeAuthCookies } from '@/lib/auth-cookie';

const tokens = { accessToken: 'acc', refreshToken: 'ref' };

describe('writeAuthCookies', () => {
  it('proxy가 쓰는 응답 쿠키(res.cookies)에 두 토큰을 같은 옵션으로 심는다', () => {
    const res = NextResponse.next();

    writeAuthCookies(res.cookies, tokens);

    expect(res.cookies.get(ACCESS_COOKIE)).toMatchObject({
      value: 'acc',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    expect(res.cookies.get(REFRESH_COOKIE)).toMatchObject({
      value: 'ref',
      httpOnly: true,
      sameSite: 'lax',
      path: '/', // '/api/auth' 같은 좁은 경로면 proxy가 못 읽어 자동 갱신이 멈춘다 (트러블 #32)
      maxAge: 7 * 24 * 60 * 60,
    });
  });

  it('응답 헤더에 HttpOnly로 나간다', () => {
    const res = NextResponse.next();

    writeAuthCookies(res.cookies, tokens);

    const header = res.headers.getSetCookie().join('\n');
    expect(header).toMatch(/access_token=acc;.*HttpOnly/u);
    expect(header).toMatch(/refresh_token=ref;.*HttpOnly/u);
  });
});
