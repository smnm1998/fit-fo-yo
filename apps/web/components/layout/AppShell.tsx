'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useUiStore } from '@/lib/store/ui-store';
import { Sidebar } from './Sidebar';
import type { ApiUser } from '@/lib/types';

const STYLES = {
  shell: 'flex min-h-screen',
  content: 'flex min-w-0 flex-1 flex-col',
  mobileBar:
    'sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface px-4 md:hidden',
  brandName: 'text-base font-bold text-foreground',
  iconBtn: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  main: 'mx-auto w-full max-w-3xl px-4 py-6',
} as const;

export function AppShell({ user, children }: { user: ApiUser; children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className={STYLES.shell}>
      <Sidebar />
      <div className={STYLES.content}>
        <header className={STYLES.mobileBar}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={STYLES.iconBtn}
            aria-label="메뉴 열기"
          >
            <Menu size={20} />
          </button>
          <Image src="/Symbol.svg" alt="" width={22} height={22} />
          <span className={STYLES.brandName}>FitFoYo</span>
        </header>
        <main className={STYLES.main}>{children}</main>
      </div>
    </div>
  );
}
