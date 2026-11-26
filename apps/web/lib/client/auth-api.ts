import { z } from 'zod';
import { AuthResultSchema, OkSchema } from '@/lib/schemas/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String).join('\n');
    if (typeof message === 'string') return message;
  }
  return '요청을 처리하지 못했습니다.';
}

/** 서버가 약속한 모양과 다른 응답을 보냈을 때 화면에 보여 줄 문구 */
const CONTRACT_MESSAGE = '서버 응답 형식이 예상과 달라요. 잠시 후 다시 시도해 주세요.';

/**
 * BFF 호출 + 응답 모양 확인
 * - 실패 응답(4xx·5xx) → ApiError(그 상태 코드, 서버 메시지)
 * - 성공인데 모양이 다름 → ApiError(502) + 콘솔에 어긋난 필드
 */
export async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  init?: RequestInit,
): Promise<z.output<S>> {
  const res = await fetch(path, init);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, extractMessage(data));

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(`[request] ${path} 응답 형식이 다름\n${z.prettifyError(parsed.error)}`);
    throw new ApiError(502, CONTRACT_MESSAGE);
  }
  return parsed.data;
}

type AuthResult = z.infer<typeof AuthResultSchema>;

export function login(email: string, password: string): Promise<AuthResult> {
  return request('/api/auth/login', AuthResultSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function signup(input: {
  email: string;
  password: string;
  nickname?: string;
}): Promise<AuthResult> {
  return request('/api/auth/signup', AuthResultSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return request('/api/auth/logout', OkSchema, { method: 'POST' });
}

export function fetchMe(): Promise<AuthResult> {
  return request('/api/auth/me', AuthResultSchema);
}
