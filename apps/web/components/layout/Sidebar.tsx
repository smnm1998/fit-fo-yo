'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  BarChart3,
  CalendarDays,
  FileText,
  Lock,
  LogOut,
  PanelLeft,
  Target,
  User,
  Users,
  X,
} from 'lucide-react';
import { ProfileDialog } from '@/components/layout/ProfileDialog';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { logout } from '@/lib/client/auth-api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useUiStore } from '@/lib/store/ui-store';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const NAV = [
  { href: '/dashboard', label: '캘린더', Icon: CalendarDays },
  { href: '/stats', label: '통계', Icon: BarChart3 },
] as const;

const SOON = [
  { label: '목표 관리', Icon: Target },
  { label: '리포트', Icon: FileText },
  { label: '커뮤니티', Icon: Users },
] as const;

const STYLES = {
  backdrop: 'fixed inset-0 z-40 bg-black/20 md:hidden',
  aside:
    'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-surface transition-all md:sticky md:top-0 md:h-screen md:z-auto md:translate-x-0',
  brand: 'flex h-14 items-center px-4',
  brandName: 'truncate text-base font-bold text-foreground',
  nav: 'flex flex-1 flex-col gap-1 px-2 py-2',
  link: 'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground',
  linkSoon:
    'group relative flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted/50',
  soonLabel: 'px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted/60',
  soonTip:
    'pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground opacity-0 shadow-sm transition-opacity group-hover/soon:opacity-100',
  linkActive: 'bg-subtle text-foreground',
  bottom: 'flex flex-col gap-1 border-t border-border p-2',
  account:
    'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-subtle',
  avatar: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-surface',
  accountInfo: 'flex min-w-0 flex-col',
  accountName: 'truncate text-sm font-medium text-foreground',
  accountEmail: 'truncate text-xs text-muted',
  menu: 'z-50 flex w-44 flex-col rounded-xl border border-border bg-surface p-1 shadow-lg origin-[var(--radix-popover-content-transform-origin)] data-[state=open]:animate-[popIn_120ms_ease-out]',
  menuItem:
    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-subtle',

  iconBtn: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  tooltip:
    'pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 md:block',
} as const;

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user?.nickname?.trim() || user?.email?.split('@')[0] || '사용자';

  const pathname = usePathname();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const collapsed = useUiStore((s) => s.collapsed);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

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
    <>
      {mobileOpen && <div className={STYLES.backdrop} onClick={() => setMobileOpen(false)} />}
      <aside
        className={cn(
          STYLES.aside,
          collapsed ? 'md:w-16' : 'md:w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* 브랜드 */}
        <div
          className={cn(
            STYLES.brand,
            collapsed ? 'justify-between md:justify-center md:px-2' : 'justify-between',
          )}
        >
          {/* 펼침 브랜드 (모바일 항상 + 데스크탑 펼침) */}
          <div className={cn('flex min-w-0 items-center gap-2', collapsed && 'md:hidden')}>
            <Image src="/Symbol.svg" alt="" width={24} height={24} className="shrink-0" />
            <span className={STYLES.brandName}>FitFoYo</span>
          </div>

          {/* 데스크탑 접힘: 심볼=펼치기 (hover 시 360° 회전 → 접기 아이콘) */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="사이드바 펼치기"
            className={cn(
              'group relative hidden h-9 w-9 items-center justify-center',
              collapsed && 'md:flex',
            )}
          >
            <Image
              src="/Symbol.svg"
              alt=""
              width={24}
              height={24}
              className="transition-all duration-500 group-hover:rotate-[360deg] group-hover:opacity-0"
            />
            <PanelLeft
              size={18}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </button>

          {/* 데스크탑 펼침: 접기 토글 */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="사이드바 접기"
            className={cn(STYLES.iconBtn, 'hidden md:flex', collapsed && 'md:hidden')}
          >
            <PanelLeft size={18} />
          </button>

          {/* 모바일 닫기 */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="메뉴 닫기"
            className={cn(STYLES.iconBtn, 'md:hidden')}
          >
            <X size={18} />
          </button>
        </div>

        {/* 네비 */}
        <nav className={STYLES.nav}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(STYLES.link, active && STYLES.linkActive)}
              >
                <Icon size={18} className="shrink-0" />
                <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
                {collapsed && <span className={STYLES.tooltip}>{label}</span>}
              </Link>
            );
          })}
          <p className={cn(STYLES.soonLabel, collapsed && 'md:hidden')}>곧 추가돼요</p>
          {SOON.map(({ label, Icon }) => (
            <div key={label} className={STYLES.linkSoon} aria-disabled="true">
              <Icon size={18} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
              <Lock size={13} className={cn('ml-auto shrink-0', collapsed && 'md:hidden')} />
              {collapsed && <span className={STYLES.tooltip}>{label}</span>}
            </div>
          ))}
        </nav>

        {/* 하단: 계정 위젯 + 다크 토글 */}
        <div className={STYLES.bottom}>
          <div
            className={cn(
              'flex items-center gap-1',
              collapsed && 'md:flex-col-reverse md:items-center',
            )}
          >
            <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    STYLES.account,
                    'min-w-0 flex-1',
                    collapsed && 'md:flex-none md:justify-center',
                  )}
                >
                  <span className={STYLES.avatar}>
                    <User size={18} />
                  </span>
                  <span className={cn(STYLES.accountInfo, collapsed && 'md:hidden')}>
                    <span className={STYLES.accountName}>{displayName}</span>
                    {user?.email && <span className={STYLES.accountEmail}>{user.email}</span>}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side={collapsed ? 'right' : 'top'}
                  align={collapsed ? 'end' : 'start'}
                  sideOffset={8}
                  collisionPadding={12}
                  className={STYLES.menu}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className={cn(STYLES.menuItem, 'text-foreground')}
                  >
                    <User size={16} className="shrink-0" /> 내 정보
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void onLogout();
                    }}
                    className={cn(STYLES.menuItem, 'text-danger')}
                  >
                    <LogOut size={16} className="shrink-0" /> 로그아웃
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <ThemeToggle />
          </div>

          <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
        </div>
      </aside>
    </>
  );
}
