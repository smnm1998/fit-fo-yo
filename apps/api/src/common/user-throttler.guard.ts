import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Authorization: Bearer <JWT>의 sub(사용자 id)를 읽는다. 서명은 확인하지 않는다
 * - 서명 확인은 뒤에 도는 JwtAccessGuard/JwtRefreshGuard가 한다
 * - 위조 토큰은 새 칸을 만들 수 있어도 곧바로 401로 끝나 AI 호출·DB 쓰기 같은 일을 하지 않는다
 */
export function bearerSubject(headers: unknown): string | null {
  if (typeof headers !== 'object' || headers === null) return null;
  const auth = (headers as { authorization?: unknown }).authorization;
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return null;

  const payload = auth.slice('Bearer '.length).split('.')[1];
  if (!payload) return null;
  try {
    const { sub } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
    };
    return typeof sub === 'string' && sub !== '' ? sub : null;
  } catch {
    return null;
  }
}

/**
 * 요청 횟수 제한을 로그인한 요청은 사용자 단위로, 아니면 IP 단위로 센다
 * 모든 요청이 BFF(Vercel) 서버를 거쳐 오므로 IP만으로 세면 여러 사용자가 한 칸을 나눠 쓰게 된다
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = bearerSubject(req.headers);
    return userId ? Promise.resolve(`user:${userId}`) : super.getTracker(req);
  }
}
