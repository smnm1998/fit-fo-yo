import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@fitfoyo/database';
import type { StringValue } from 'ms';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { PasswordService } from './password.service';
import { GoogleAuthUser } from './strategies/google.strategy';

export type AuthUser = Pick<User, 'id' | 'email' | 'nickname' | 'isGuest'>;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // 회원가입
  async signup(dto: SignupDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await this.password.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        isGuest: false,
      },
      select: { id: true, email: true, nickname: true, isGuest: true },
    });

    const tokens = await this.issueTokens(user.id, user.isGuest);
    await this.persistRefreshHash(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // 로그인
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        nickname: true,
        isGuest: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const valid = await this.password.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = await this.issueTokens(user.id, user.isGuest);
    await this.persistRefreshHash(user.id, tokens.refreshToken);

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isGuest: user.isGuest,
    };
    return { user: safeUser, tokens };
  }

  // Refresh
  async refresh(userId: string, isGuest: boolean): Promise<AuthTokens> {
    const tokens = await this.issueTokens(userId, isGuest);
    await this.persistRefreshHash(userId, tokens.refreshToken);
    return tokens;
  }

  // 로그아웃
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // 게스트 발급
  async issueGuest(): Promise<AuthResult> {
    const user = await this.prisma.user.create({
      data: { isGuest: true },
      select: { id: true, email: true, nickname: true, isGuest: true },
    });

    const tokens = await this.issueTokens(user.id, user.isGuest);
    await this.persistRefreshHash(user.id, tokens.refreshToken);

    this.logger.log(`Guest user issued: ${user.id}`);
    return { user, tokens };
  }

  // Google OAuth
  async findOrCreateGoogleUser(googleUser: GoogleAuthUser): Promise<AuthResult> {
    // 1. 이미 Google 연동된 user 검색
    let user = await this.prisma.user.findFirst({
      where: { providerId: googleUser.providerId },
      select: { id: true, email: true, nickname: true, isGuest: true },
    });

    if (!user) {
      // 2. 같은 email의 기존 계정 있나? → providerId만 연동
      const byEmail = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
        select: { id: true },
      });

      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { providerId: googleUser.providerId },
          select: { id: true, email: true, nickname: true, isGuest: true },
        });
        this.logger.log(`Google account linked to existing user: ${user.id}`);
      } else {
        // 3. 신규 user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            nickname: googleUser.nickname,
            provider: 'google',
            providerId: googleUser.providerId,
            isGuest: false,
          },
          select: { id: true, email: true, nickname: true, isGuest: true },
        });
        this.logger.log(`Google user created: ${user.id}`);
      }
    }

    const tokens = await this.issueTokens(user.id, user.isGuest);
    await this.persistRefreshHash(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // 헬퍼: 토큰 발급
  private async issueTokens(userId: string, isGuest: boolean): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({ sub: userId, isGuest });
    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as StringValue,
      },
    );

    return { accessToken, refreshToken };
  }

  // 헬퍼: DB에 refresh hash 저장
  private async persistRefreshHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await this.password.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
