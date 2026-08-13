'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CircleAlert, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const S = {
  wrap: 'flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center',
  icon: 'flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger',
  body: 'flex flex-col gap-2',
  title: 'text-lg font-semibold text-foreground',
  desc: 'max-w-sm text-sm leading-relaxed text-muted',
  actions: 'mt-1 flex items-center gap-2',
  link: 'inline-flex h-10 items-center rounded-lg px-4 text-base font-semibold text-muted transition hover:bg-subtle hover:text-foreground',
  digest: 'mt-2 text-xs text-muted/70',
} as const;

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 원인 파악용 — prod 브라우저 콘솔엔 상세 대신 digest만 남음
    console.error(error);
  }, [error]);

  return (
    <div className={S.wrap}>
      <span className={S.icon}>
        <CircleAlert size={24} strokeWidth={2} aria-hidden />
      </span>

      <div className={S.body}>
        <h2 className={S.title}>데이터를 불러오지 못했어요</h2>
        <p className={S.desc}>
          일시적인 문제일 수 있어요. 다시 시도해도 안 되면 잠시 후 다시 들어와 주세요.
        </p>
      </div>

      <div className={S.actions}>
        <Button variant="primary" onClick={reset}>
          <RotateCw size={16} aria-hidden />
          다시 시도
        </Button>
        <Link href="/dashboard" className={S.link}>
          대시보드로
        </Link>
      </div>

      {error.digest && <p className={S.digest}>오류 코드: {error.digest}</p>}
    </div>
  );
}
