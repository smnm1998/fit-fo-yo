'use client';

import { useCallback, useEffect, useState } from 'react';
import { logout } from '@/lib/client/auth-api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useChatStore } from '@/lib/store/chat-store';
import type { ApiUser } from '@/lib/types';

const GUEST_SESSION_MS = 5 * 60 * 1000;

const STYLES = {
  overlay: 'fixed inset-0 z-[80] grid place-items-center bg-background/80 p-6 backdrop-blur-md',
  card: 'flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-7 text-center shadow-2xl',
  title: 'text-lg font-bold text-foreground',
  text: 'text-sm leading-relaxed text-muted',
  actions: 'mt-4 flex w-full flex-col gap-2',
  primary:
    'w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-surface transition-opacity hover:opacity-90',
  ghost:
    'w-full rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-subtle',
} as const;

export function GuestSessionGate({ user }: { user: ApiUser }) {
  const [expired, setExpired] = useState(false);

  const endSession = useCallback(async () => {
    setExpired(true);
    try {
      await logout();
    } catch {
      // 업스트림이 죽어도 화면은 이미 막혀 있으므로 무시
    }
    useAuthStore.getState().clear();
    useChatStore.getState().reset();
  }, []);

  useEffect(() => {
    if (!user.isGuest) return;

    const endsAt = new Date(user.createdAt).getTime() + GUEST_SESSION_MS;
    if (Number.isNaN(endsAt)) return;

    const check = () => {
      if (Date.now() >= endsAt) void endSession();
    };

    if (Date.now() >= endsAt) {
      void endSession();
      return;
    }

    const timer = window.setTimeout(check, endsAt - Date.now());
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user.isGuest, user.createdAt, endSession]);

  if (!expired) return null;

  return (
    <div
      className={STYLES.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="guest-expired-title"
    >
      <div className={STYLES.card}>
        <p id="guest-expired-title" className={STYLES.title}>
          게스트 체험이 끝났어요
        </p>
        <p className={STYLES.text}>
          5분이 지나 둘러보기가 종료되었습니다. <br />
          이어서 기록하려면 회원가입을 해주세요.
        </p>
        <div className={STYLES.actions}>
          <button
            type="button"
            className={STYLES.primary}
            onClick={() => {
              window.location.href = '/signup';
            }}
          >
            회원가입 하러 가기
          </button>
          <button
            type="button"
            className={STYLES.ghost}
            onClick={() => {
              window.location.href = '/login';
            }}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
