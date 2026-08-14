import { cache } from 'react';
import { apiFetchAuth } from './api';
import type { ApiUser } from '@/lib/types';

/** 요청 단위 캐시 - 같은 렌더 패스에서 /auth/me 중복 호출 제거 */
export const getCurrentUser = cache(async (): Promise<ApiUser | null> => {
  const res = await apiFetchAuth('/auth/me');
  if (!res.ok) return null;
  const { user } = (await res.json()) as { user: ApiUser };
  return user;
});
