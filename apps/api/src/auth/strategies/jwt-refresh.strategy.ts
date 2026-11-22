import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type RefreshTokenPayload = {
  sub: string;
};

export type RefreshRequestUser = {
  id: string;
  refreshToken: string;
};

/** 서명, 만료만 검증하고 원본 토큰을 넘긴다. 저장된 해시와 대조·회전은 AuthService가 한다 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const cookies = req.cookies as Record<string, string | undefined> | undefined;
          return cookies?.refresh_token ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshRequestUser {
    const authHeader = req.headers.authorization;
    const refreshToken =
      (req.cookies?.refresh_token as string | undefined) ??
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

    if (!refreshToken) throw new UnauthorizedException();

    return { id: payload.sub, refreshToken };
  }
}
