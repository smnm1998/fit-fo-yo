'use client';

import { ErrorState } from '@/components/ui/ErrorState';

/** (app) 화면(캘린더·통계·채팅)의 에러 — 서버에서 데이터 조회나 응답 검증이 실패하면 여기로 온다 */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      title="데이터를 불러오지 못했어요"
      description="일시적인 문제일 수 있어요. 다시 시도해도 안 되면 잠시 후 다시 들어와 주세요."
      homeHref="/dashboard"
      homeLabel="대시보드로"
    />
  );
}
