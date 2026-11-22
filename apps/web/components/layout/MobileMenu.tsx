'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV, SOON } from '@/lib/nav';
import { useLogout } from '@/lib/hooks/useLogout';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const STYLES = {
  panel:
    'fixed inset-x-0 bottom-0 top-[56px] z-40 flex flex-col overflow-y-auto bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 transition-[clip-path,opacity] duration-200 ease-out motion-reduce:transition-none md:hidden',
  panelOpen: 'opacity-100 [clip-path:inset(0_0_0_0)]',
  panelClosed: 'pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]',
  item: 'flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-semibold text-muted transition-colors active:bg-subtle',
  itemActive: 'bg-subtle text-foreground',
  soonLabel: 'px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-wider text-muted/60',
  soon: 'flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-semibold text-muted/50',
  divider: 'mt-auto mb-4 h-px bg-border',
  danger: 'text-danger',
} as const;

type Props = { open: boolean; onClose: () => void; onOpenProfile: () => void };

export function MobileMenu({ open, onClose, onOpenProfile }: Props) {
  const pathname = usePathname();
  const logoutAndLeave = useLogout();

  // 열려 있는 동안만 뒤 화면 스크롤 잠금 + Esc 닫기
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <nav
      id="mobile-menu"
      aria-hidden={!open}
      className={cn(STYLES.panel, open ? STYLES.panelOpen : STYLES.panelClosed)}
    >
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className={cn(STYLES.item, pathname.startsWith(href) && STYLES.itemActive)}
        >
          <Icon size={20} className="shrink-0" />
          {label}
        </Link>
      ))}

      <p className={STYLES.soonLabel}>곧 추가돼요</p>
      {SOON.map(({ label, Icon }) => (
        <div key={label} className={STYLES.soon} aria-disabled="true">
          <Icon size={19} className="shrink-0" />
          {label}
          <Lock size={14} className="ml-auto shrink-0" />
        </div>
      ))}

      <div className={STYLES.divider} />

      <ThemeToggle label="화면 모드" className={STYLES.item} />

      <button type="button" onClick={onOpenProfile} className={STYLES.item}>
        <User size={19} className="shrink-0" />내 정보
      </button>

      <button
        type="button"
        onClick={() => {
          onClose();
          void logoutAndLeave();
        }}
        className={cn(STYLES.item, STYLES.danger)}
      >
        <LogOut size={19} className="shrink-0" />
        로그아웃
      </button>
    </nav>
  );
}
