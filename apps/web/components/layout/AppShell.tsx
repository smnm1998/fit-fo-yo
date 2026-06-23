'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth-store';
import { logout } from '@/lib/client/auth-api';
import type { ApiUser } from '@/lib/types';

const STYLES = {
  header:
    'sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-4',
  brand: 'flex items-center gap-2',
  brandName: 'text-base font-bold text-foreground',
  nav: 'flex items-center gap-1',
  navLink:
    'rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground',
  navLinkActive: 'bg-subtle text-foreground',
  right: 'flex items-center gap-3',
  nickname: 'text-sm text-muted',
  logout: 'text-sm font-medium text-muted transition-colors hover:text-foreground',
  main: 'mx-auto w-full max-w-2xl px-4 py-6',
} as const;

export function AppShell({ user, children }: { user: ApiUser; children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  async function onLogout() {
    try {
      await logout();
    } finally {
      clear();
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <header className={STYLES.header}>
        <nav className={STYLES.nav}>
          <NavLink href="/dashboard">오늘</NavLink>
          <NavLink href="/calendar">캘린더</NavLink>
          <NavLink href="/stats">통계</NavLink>
        </nav>
        <div className={STYLES.brand}>
          <Image src="/Symbol.svg" alt="" width={24} height={24} />
          <span className={STYLES.brandName}>FitFoYo</span>
        </div>
        <div className={STYLES.right}>
          <span className={STYLES.nickname}>{user.nickname ?? '게스트'}</span>
          <button type="button" onClick={onLogout} className={STYLES.logout}>
            로그아웃
          </button>
        </div>
      </header>
      <main className={STYLES.main}>{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link href={href} className={cn(STYLES.navLink, active && STYLES.navLinkActive)}>
      {children}
    </Link>
  );
}
