import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuthResult } from './auth.service';

type Ticket = { result: AuthResult; expiresAt: number };

/**
 * OAuth 콜백 결과(user+tokens)를 "일회용 교환 코드"로 잠깐 보관하는 핸드오프 저장소
 * - 토큰을 리다이렉트 URL에 직접 싣지 않기 위함
 * - code = randomUUID(122bit, 추측 불가), TTL 60초, 조회 즉시 폐기
 * - 인메모리: 단일 인스턴스 전제, 수평 확장 시 Redis/DB로 교체
 */
@Injectable()
export class OAuthTicketService {
  private readonly TTL_MS = 60_000;
  private readonly store = new Map<string, Ticket>();

  issue(result: AuthResult): string {
    this.sweep(); // 발급 시점에 만료분 청소 -> 별도 크론 불필요
    const code = randomUUID();
    this.store.set(code, { result, expiresAt: Date.now() + this.TTL_MS });
    return code;
  }
  consume(code: string): AuthResult | null {
    const ticket = this.store.get(code);
    if (!ticket) return null;
    this.store.delete(code);
    return ticket.expiresAt < Date.now() ? null : ticket.result;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, t] of this.store) {
      if (t.expiresAt < now) this.store.delete(code);
    }
  }
}
