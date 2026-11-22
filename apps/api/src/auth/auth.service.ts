import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@fitfoyo/database';
import type { StringValue } from '../common/duration';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomUUID } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { PasswordService } from './password.service';
import { GoogleAuthUser } from './strategies/google.strategy';

export type AuthUser = Pick<User, 'id' | 'email' | 'nickname' | 'isGuest' | 'createdAt'>;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};

/** 같은 refresh 토큰으로 이 시간 안에 다시 오면 방금 발급한 토큰을 그대로 돌려줌 (동시 갱신 대비) */
const REFRESH_GRACE_MS = 10_000;

type RecentRefresh = { userId: string; result: Promise<AuthTokens>; expiresAt: number };

/**
 * refresh 토큰은 서버가 만든 고엔트로피 값이라 느린 해시가 필요 없음
 * bcrypt는 72바이트 넘으면 잘림
 */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** 키 = 갱신에 쓰인 refresh 토큰의 해시. 인스턴스 1개 전제 (여러 대면 공유 저장소 필요) */
  private readonly recentRefreshes = new Map<string, RecentRefresh>();

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
      select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
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
        createdAt: true,
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
      createdAt: user.createdAt,
    };
    return { user: safeUser, tokens };
  }

  // Refresh
  refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const key = sha256(refreshToken);
    const now = Date.now();
    for (const [k, v] of this.recentRefreshes) {
      if (v.expiresAt <= now) this.recentRefreshes.delete(k);
    }

    const recent = this.recentRefreshes.get(key);
    if (recent) return recent.result;

    const result = this.rotate(userId, key);
    this.recentRefreshes.set(key, { userId, result, expiresAt: now + REFRESH_GRACE_MS });
    result.catch(() => this.recentRefreshes.delete(key));
    return result;
  }

  // 로그아웃
  async logout(userId: string, refreshToken: string): Promise<void> {
    for (const [k, v] of this.recentRefreshes) {
      if (v.userId === userId) this.recentRefreshes.delete(k);
    }

    await this.prisma.user.updateMany({
      where: { id: userId, refreshTokenHash: sha256(refreshToken) },
      data: { refreshTokenHash: null },
    });
  }

  // 게스트 발급
  async issueGuest(): Promise<AuthResult> {
    const user = await this.prisma.user.create({
      data: { isGuest: true },
      select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
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
      select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
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
          select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
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
          select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
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
    // jti: 같은 초에 발급해도 토큰이 달라지게 (JWT는 payload가 같으면 같은 문자열)
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as StringValue,
      },
    );

    return { accessToken, refreshToken };
  }

  // 헬퍼: DB에 refresh hash 저장 (로그인·가입·게스트·OAuth = 새 세션)
  private async persistRefreshHash(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: sha256(refreshToken) },
    });
  }

  /** 저장된 해시가 낸 토큰의 해시일 때만 새 해시로 바꾼다 — 조건부 UPDATE 한 번이라 비교와 교체가 원자적 */
  private async rotate(userId: string, presentedHash: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isGuest: true },
    });
    if (!user) throw new UnauthorizedException('Token revoked');

    const tokens = await this.issueTokens(userId, user.isGuest);
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, refreshTokenHash: presentedHash },
      data: { refreshTokenHash: sha256(tokens.refreshToken) },
    });
    if (count === 0) throw new UnauthorizedException('Token revoked');
    return tokens;
  }

  /** /auth/me 전용 — 가드가 더는 프로필을 싣지 않으므로 여기서 조회 */
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, isGuest: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
