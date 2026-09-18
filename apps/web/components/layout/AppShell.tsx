'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import type { ApiUser } from '@/lib/types';
import { GuestSessionGate } from './GuestSessionGate';

const STYLES = {
  shell: 'flex min-h-screen',
  content: 'flex min-w-0 flex-1 flex-col',
  main: 'mx-auto w-full max-w-6xl px-4 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:py-6',
} as const;

export function AppShell({ user, children }: { user: ApiUser; children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className={STYLES.shell}>
      <GuestSessionGate user={user} />
      <Sidebar />
      <div className={STYLES.content}>
        <MobileHeader />
        <main className={STYLES.main}>{children}</main>
      </div>
    </div>
  );
}
