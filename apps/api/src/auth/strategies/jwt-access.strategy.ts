import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type AccessTokenPayload = {
  sub: string;
  isGuest: boolean;
};

export type AccessUser = { id: string; isGuest: boolean };

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = req.cookies as Record<string, string | undefined> | undefined;
          return cookies?.access_token ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // 토큰 서명·만료만으로 인증 확정 — 요청당 DB 조회 제거 (읽기 왕복 -1/요청)
  validate(payload: AccessTokenPayload): AccessUser {
    return { id: payload.sub, isGuest: payload.isGuest };
  }
}
