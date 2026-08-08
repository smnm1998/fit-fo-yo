import { Sparkles } from 'lucide-react';
import type { WeekComparison } from '@/lib/records';

const STYLES = {
  card: 'flex flex-col gap-3 rounded-lg border border-border bg-surface p-5',
  head: 'flex items-center gap-1.5 text-sm font-semibold text-foreground',
  row: 'flex flex-col gap-1',
  label: 'text-xs font-medium text-muted',
  text: 'text-sm leading-relaxed text-foreground',
} as const;

function feedbackText(c: WeekComparison, count: number): string {
  if (count === 0)
    return '이번 주는 아직 기록이 없어요. 한 끼라도 남겨두면 다음 주부터 비교가 시작돼요.';
  const parts: string[] = [];
  if (c.calories.prev > 0) {
    const d = c.calories.delta;
    parts.push(
      d === 0
        ? '섭취량은 지난주와 비슷했어요'
        : `지난주보다 ${Math.abs(d).toLocaleString()}kcal ${d > 0 ? '더' : '덜'} 먹었어요`,
    );
  }
  if (c.caloriesBurned.value > 0) {
    const d = c.caloriesBurned.delta;
    parts.push(
      c.caloriesBurned.prev === 0
        ? '이번 주부터 운동 기록이 생겼어요'
        : `운동 소모는 지난주보다 ${Math.abs(d).toLocaleString()}kcal ${d >= 0 ? '늘었어요' : '줄었어요'}`,
    );
  }
  return parts.length > 0 ? `${parts.join('. ')}.` : '이번 주 기록으로 다음 주 흐름을 만들어봐요.';
}

function suggestionText(c: WeekComparison, count: number): string {
  if (count === 0) return '다음 주엔 하루 한 끼만이라도 꾸준히 기록해보세요.';
  if (c.caloriesBurned.value === 0)
    return '다음 주엔 가벼운 유산소를 주 2~3회 넣어보면 순 칼로리 관리에 도움이 돼요.';
  if (c.calories.delta > 0 && c.caloriesBurned.delta <= 0)
    return '섭취는 늘고 운동은 줄었어요. 다음 주엔 운동 빈도를 한 번씩만 더 늘려보세요.';
  if (c.net.delta < 0)
    return '순 칼로리가 지난주보다 줄었어요. 이 페이스를 다음 주에도 유지해보세요.';
  return '다음 주엔 기록을 하루도 빠뜨리지 않는 걸 목표로 해보세요.';
}

export function WeeklyInsight({ data, count }: { data: WeekComparison; count: number }) {
  return (
    <section className={STYLES.card}>
      <h2 className={STYLES.head}>
        <Sparkles size={15} /> 이번 주 돌아보기
      </h2>
      <div className={STYLES.row}>
        <span className={STYLES.label}>피드백</span>
        <p className={STYLES.text}>{feedbackText(data, count)}</p>
      </div>
      <div className={STYLES.row}>
        <span className={STYLES.label}>다음 주 제안</span>
        <p className={STYLES.text}>{suggestionText(data, count)}</p>
      </div>
    </section>
  );
}
