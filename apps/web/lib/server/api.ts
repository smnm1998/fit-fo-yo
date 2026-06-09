import { cookies } from 'next/headers';

const API_URL = process.env.API_URL;

/** 비인증 호출 (login/setup) */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, { ...init, cache: 'no-store' });
}

/** 인증 호출 - 쿠키의 access_token을 Bearer로 부착 */
export async function apiFetchAuth(path: string, init?: RequestInit): Promise<Response> {
  const token = (await cookies()).get('access_token')?.value;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}
