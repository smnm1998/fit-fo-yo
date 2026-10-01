'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import type { ApiUser } from '@/lib/types';
import { GuestSessionGate } from './GuestSessionGate';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const STYLES = {
  shell: 'flex min-h-screen',
  content: 'flex min-w-0 flex-1 flex-col',
  main: 'mx-auto w-full max-w-6xl px-4 pt-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:py-6',
  mainBare: 'max-w-none px-0 pt-0 pb-0 md:py-0 wide:mx-auto wide:max-w-6xl wide:px-4 wide:py-6',
} as const;

export function AppShell({ user, children }: { user: ApiUser; children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const pathname = usePathname();
  const bare = pathname.startsWith('/chat');

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className={STYLES.shell}>
      <GuestSessionGate user={user} />
      <Sidebar />
      <div className={STYLES.content}>
        <MobileHeader />
        <main className={cn(STYLES.main, bare && STYLES.mainBare)}>{children}</main>
      </div>
    </div>
  );
}
