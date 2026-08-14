import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

const STYLES = {
  page: 'min-h-dvh bg-background',
  header: 'sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur',
  inner: 'mx-auto flex h-14 max-w-3xl items-center justify-between px-5',
  home: 'flex items-center gap-2 text-sm font-semibold text-foreground',
  back: 'text-sm text-muted transition-colors hover:text-foreground',
  main: 'mx-auto max-w-3xl px-5 py-10',
} as const;

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={STYLES.page}>
      <header className={STYLES.header}>
        <div className={STYLES.inner}>
          <Link href="/" className={STYLES.home}>
            <Image src="/Symbol.svg" alt="FitFoYo" width={24} height={24} unoptimized />
            FitFoYo
          </Link>
          <Link href="/" className={STYLES.back}>
            홈으로
          </Link>
        </div>
      </header>
      <main className={STYLES.main}>{children}</main>
    </div>
  );
}
