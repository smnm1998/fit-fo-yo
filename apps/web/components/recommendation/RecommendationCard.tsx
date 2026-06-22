import { cn } from '@/lib/cn';
import type { RecommendationDto, RecommendationFocus } from '@/lib/types';

const FOCUS_META: Record<RecommendationFocus, { label: string; badge: string }> = {
  diet: { label: '식단 보강', badge: 'bg-emerald-50 text-emerald-700' },
  exercise: { label: '운동 보강', badge: 'bg-sky-50 text-sky-70' },
  balanced: { label: '균형', badge: 'bg-subtle text-muted' },
};

const STYLES = {
  card: 'rounded-lg border border-border bg-surface p-5',
  head: 'mb-2 flex items-center justify-between',
  label: 'text-xs font-medium text-muted',
  badge: 'rounded-full px-2 py-0.5 text-xs font-medium',
  message: 'text-sm leading-relaxed text-foreground',
  stats: 'mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3',
  stat: 'flex flex-col gap-0.5',
  statLabel: 'text-xs text-muted',
  statValue: 'text-sm font-semibold tabular-nums text-foreground',
  empty: 'rounded-lg border border-border bg-surface p-5 text-sm leading-relaxed text-muted',
} as const;

export function RecommendationCard({
  recommendation,
  hideWhenEmpty,
}: {
  recommendation: RecommendationDto | null;
  hideWhenEmpty?: boolean;
}) {
  if (!recommendation) {
    if (hideWhenEmpty) return null; // 캘린더 과거일: 추천 없으면 숨김
    return (
      <div className={STYLES.empty}>
        오늘의 추천이 아직 없어요. 추천은{' '}
        <strong className="font-medium text-foreground">어제 기록</strong>을 바탕으로 매일 아침
        준비돼요. 어제 기록이 없으면 만들어지지 않으니, 오늘부터 기록해볼까요?
      </div>
    );
  }

  const { message, focus, summary } = recommendation.payload;
  const meta = FOCUS_META[focus];

  return (
    <div className={STYLES.card}>
      <div className={STYLES.head}>
        <span className={STYLES.label}>오늘의 추천</span>
        <span className={cn(STYLES.badge, meta.badge)}>{meta.label}</span>
      </div>
      <p className={STYLES.message}>{message}</p>
      <div className={STYLES.stats}>
        <Stat label="어제 섭취" value={`${summary.totalCalories} kcal`} />
        <Stat label="단백질" value={`${summary.protein} g`} />
        <Stat label="운동" value={`${summary.exerciseMinutes} 분`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={STYLES.stat}>
      <span className={STYLES.statLabel}>{label}</span>
      <span className={STYLES.statLabel}>{value}</span>
    </div>
  );
}
