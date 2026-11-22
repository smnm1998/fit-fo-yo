'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/client/auth-api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useChatStore } from '@/lib/store/chat-store';

/** 로그아웃 - 업스트림 실패와 무관하게 로컬 상태를 비우고 로그인으로 보낸다 */
export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clear);

  return async function logoutAndLeave() {
    try {
      await logout();
    } finally {
      clearAuth();
      useChatStore.getState().reset();
      router.replace('/login');
      router.refresh();
    }
  };
}
