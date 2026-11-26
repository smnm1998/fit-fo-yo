'use client';

import { ErrorState } from '@/components/ui/ErrorState';

/**
 * (app) 밖 화면(랜딩·로그인·약관)의 에러
 * (app)/layout.tsx 자체가 실패할 때도 여기로 온다 — 같은 폴더의 error.tsx는 그 폴더 layout을 감싸지 않음
 */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <ErrorState
        error={error}
        retry={retry}
        title="문제가 생겼어요"
        description="일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요."
        homeHref="/"
        homeLabel="처음으로"
      />
    </main>
  );
}
