import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../password.service';

type RefreshValidateResult = {
  id: string;
  isGuest: boolean;
  refreshToken: string;
};

export type RefreshTokenPayload = {
  sub: string;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.refresh_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload): Promise<RefreshValidateResult> {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, refreshTokenHash: true, isGuest: true },
    });

    if (!user?.refreshTokenHash) throw new UnauthorizedException('Token revoked');

    const isValid = await this.password.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException('Token mismatch');

    return {
      id: user.id,
      isGuest: user.isGuest,
      refreshToken,
    };
  }
}
