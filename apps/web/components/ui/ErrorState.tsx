'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CircleAlert, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const STYLES = {
  wrap: 'flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center',
  icon: 'flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger',
  body: 'flex flex-col gap-2',
  title: 'text-lg font-semibold text-foreground',
  desc: 'max-w-sm text-sm leading-relaxed text-muted',
  actions: 'mt-1 flex items-center gap-2',
  link: 'inline-flex h-10 items-center rounded-lg px-4 text-base font-semibold text-muted transition hover:bg-subtle hover:text-foreground',
  digest: 'mt-2 text-xs text-muted/70',
} as const;

/** 서버에서 난 에러에 Next가 붙이는 식별자 (서버 로그와 맞춰 볼 때 씀) */
function digestOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('digest' in error)) return undefined;
  return typeof error.digest === 'string' ? error.digest : undefined;
}

type Props = {
  error: unknown;
  retry: () => void;
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
};

/**
 * error.tsx · global-error.tsx 공용 화면
 * 원인은 콘솔에 남기고, 사용자에게는 다시 시도와 돌아갈 곳을 준다
 */
export function ErrorState({ error, retry, title, description, homeHref, homeLabel }: Props) {
  useEffect(() => {
    // 원인 파악용 — prod에서 서버 에러는 상세 대신 digest만 온다
    console.error(error);
  }, [error]);

  const digest = digestOf(error);

  return (
    <div className={STYLES.wrap}>
      <span className={STYLES.icon}>
        <CircleAlert size={24} strokeWidth={2} aria-hidden />
      </span>

      <div className={STYLES.body}>
        <h2 className={STYLES.title}>{title}</h2>
        <p className={STYLES.desc}>{description}</p>
      </div>

      <div className={STYLES.actions}>
        {/* retry: 데이터를 다시 가져와 다시 그림 (reset은 다시 그리기만 해서 서버 조회 실패는 못 고침) */}
        <Button variant="primary" onClick={retry}>
          <RotateCw size={16} aria-hidden />
          다시 시도
        </Button>
        <Link href={homeHref} className={STYLES.link}>
          {homeLabel}
        </Link>
      </div>

      {digest && <p className={STYLES.digest}>오류 코드: {digest}</p>}
    </div>
  );
}
