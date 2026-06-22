'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, generateRecommendation } from '@/lib/client/recommendations-api';

const STYLES = {
  card: 'rounded-lg border border-border bg-surface p-5',
  text: 'text-sm leading-relaxed text-muted',
  btn: 'mt-3 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50',
  notice: 'mt-2 text-xs text-danger',
} as const;

export function GenerateRecommendation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setNotice(null);
    try {
      const rec = await generateRecommendation();
      if (rec) {
        router.refresh(); // 서버 컴포넌트 재페치 → 추천 카드로 교체
      } else {
        setNotice('어제 기록이 없어 추천을 만들 수 없어요. 기록을 먼저 남겨보세요.');
      }
    } catch (err) {
      setNotice(
        err instanceof ApiError
          ? err.message
          : '추천 생성에 실패했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={STYLES.card}>
      <p className={STYLES.text}>
        오늘의 추천이 아직 없어요. 어제 기록을 바탕으로 지금 만들어볼까요?
      </p>
      <button
        type="button"
        className={STYLES.btn}
        onClick={() => void onGenerate()}
        disabled={loading}
      >
        {loading ? '생성 중…' : '추천 생성'}
      </button>
      {notice && <p className={STYLES.notice}>{notice}</p>}
    </div>
  );
}
