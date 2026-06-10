import type { ApiUser } from '@/lib/types';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, extractMessage(data));
  return data as T;
}

type AuthResult = { user: ApiUser };

export function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/login', {
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
  return request<AuthResult>('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': '/application/json' },
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/me');
}
