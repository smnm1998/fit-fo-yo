'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ProfileDialog } from './ProfileDialog';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';

const STYLES = {
  bar: 'sticky top-0 z-50 flex h-[56px] items-center justify-between bg-background px-4 after:absolute after:inset-x-[7%] after:bottom-0 after:h-px after:bg-border md:hidden',
  brand: 'flex items-center gap-2.5',
  brandName: 'text-[17px] font-bold text-foreground',
  toggle: 'grid h-10 w-10 place-items-center rounded-full text-foreground active:bg-subtle',

  // 햄버거 ↔ X 모핑: 세 줄이 가운데로 모이며 위/아래가 교차한다
  bars: 'relative h-[18px] w-[22px]',
  line: 'absolute left-0 h-[2px] w-full rounded-full bg-foreground transition-all duration-300 ease-out motion-reduce:transition-none',
  lineTop: 'top-0',
  lineTopOpen: 'top-[8px] rotate-45',
  lineMid: 'top-[8px]',
  lineMidOpen: 'top-[8px] opacity-0',
  lineBottom: 'top-[16px]',
  lineBottomOpen: 'top-[8px] -rotate-45',

  panel:
    'fixed inset-x-0 bottom-0 top-[56px] z-40 flex flex-col overflow-y-auto bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 motion-reduce:transition-none md:hidden',
  panelOpen:
    'opacity-100 [clip-path:inset(0_0_0_0)] [transition:opacity_160ms_ease-out,clip-path_300ms_ease-out]',
  panelClosed:
    'pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)] [transition:opacity_180ms_ease-in,clip-path_0ms_linear_180ms]',

  themeFab:
    'fixed bottom-4 right-4 z-50 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface text-foreground shadow-lg md:hidden',
} as const;

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  // 메뉴가 열리면 '화면 모드' 가 메뉴 항목으로 들어가고,
  // AI 기록 화면은 우측 하단 전송 버튼과 겹쳐서 띄우지 않는다
  const showThemeFab = !menuOpen && !pathname.startsWith('/chat');

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openProfile = useCallback(() => {
    setMenuOpen(false);
    setProfileOpen(true);
  }, []);

  return (
    <>
      <header className={STYLES.bar}>
        <div className={STYLES.brand}>
          <Image src="/Symbol.svg" alt="" width={30} height={30} />
          <span className={STYLES.brandName}>FitFoYo</span>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={STYLES.toggle}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <span className={STYLES.bars} aria-hidden>
            <span className={cn(STYLES.line, menuOpen ? STYLES.lineTopOpen : STYLES.lineTop)} />
            <span className={cn(STYLES.line, menuOpen ? STYLES.lineMidOpen : STYLES.lineMid)} />
            <span
              className={cn(STYLES.line, menuOpen ? STYLES.lineBottomOpen : STYLES.lineBottom)}
            />
          </span>
        </button>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} onOpenProfile={openProfile} />
      {showThemeFab && <ThemeToggle className={STYLES.themeFab} />}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
