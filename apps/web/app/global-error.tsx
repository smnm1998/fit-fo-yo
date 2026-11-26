'use client';

import './globals.css';
import { ErrorState } from '@/components/ui/ErrorState';

/**
 * 루트 레이아웃까지 실패했을 때 — 레이아웃을 대신하므로 html·body와 전역 스타일을 직접 넣는다
 * (테마 클래스를 붙이는 Providers가 없어 라이트 모드로 보임)
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="ko">
      <body>
        <title>문제가 생겼어요 · FitFoYo</title>
        <main className="flex min-h-dvh items-center justify-center px-4">
          <ErrorState
            error={error}
            retry={retry}
            title="페이지를 불러오지 못했어요"
            description="일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요."
            homeHref="/"
            homeLabel="처음으로"
          />
        </main>
      </body>
    </html>
  );
}
