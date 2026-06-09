import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, type AuthTokens, type AuthUser } from './auth.service';
import { CurrentUser, type AuthenticatedUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Logger } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleAuthUser } from './strategies/google.strategy';

type RefreshRequestUser = { id: string; isGuest: boolean; refreshToken: string };

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // 회원가입
  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const { user, tokens } = await this.auth.signup(dto);
    this.setAuthCookies(res, tokens);
    return { user, tokens };
  }

  // Google OAuth: 로그인 트리거
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport가 자동으로 Google 인증 URL로 302 redirect
    // 이 핸들러 body는 절대 실행되지 않음
  }

  // Google OAuth: callback 처리
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { tokens } = await this.auth.findOrCreateGoogleUser(req.user);
      this.setAuthCookies(res, tokens);

      const successUrl = this.config.getOrThrow<string>('WEB_AUTH_SUCCESS_URL');
      res.redirect(successUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error);
      const failureUrl = this.config.getOrThrow<string>('WEB_AUTH_FAILURE_URL');
      res.redirect(failureUrl);
    }
  }

  // 로그인
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const { user, tokens } = await this.auth.login(dto);
    this.setAuthCookies(res, tokens);
    return { user, tokens };
  }

  // Refresh (Rotation)
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { user: RefreshRequestUser },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ tokens: AuthTokens }> {
    const { id, isGuest } = req.user;
    const tokens = await this.auth.refresh(id, isGuest);
    this.setAuthCookies(res, tokens);
    return { tokens };
  }

  // 로그아웃
  @Post('logout')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.auth.logout(user.id);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  // 현재 사용자
  @Get('me')
  @UseGuards(JwtAccessGuard)
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }

  // 게스트 발급
  @Post('guest')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async guest(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const { user, tokens } = await this.auth.issueGuest();
    this.setAuthCookies(res, tokens);
    return { user, tokens };
  }

  // 쿠키 헬퍼
  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1h
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }
}
