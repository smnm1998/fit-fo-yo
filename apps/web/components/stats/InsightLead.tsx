import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateLabel } from '@/lib/date';
import type { WeekComparison } from '@/lib/records';

const STYLES = {
  wrap: 'flex flex-col gap-5',
  eyebrow: 'flex items-center gap-2.5 text-sm text-muted',
  nav: 'grid h-6 w-6 place-items-center rounded-full border border-border text-muted transition-colors hover:border-muted hover:text-foreground',
  navOff: 'pointer-events-none opacity-30',
  dot: 'h-1.5 w-1.5 rounded-full bg-emerald-500',
  range: 'tabular-nums',
  feedback: 'max-w-[30ch] text-2xl font-bold leading-snug text-foreground sm:text-3xl',
  suggestion: 'border-l-2 border-emerald-500 pl-4 text-base leading-relaxed text-muted',
  sug: 'font-semibold text-foreground',
} as const;

const weekName = (w: number) => (w === 0 ? '이번 주' : w === 1 ? '지난 주' : `${w}주 전`);

function feedbackLines(c: WeekComparison, count: number): string[] {
  if (count === 0)
    return ['이 주에는 아직 기록이 없어요.', '한 끼라도 남겨두면 다음 주부터 비교가 시작돼요.'];
  const parts: string[] = [];
  if (c.calories.prev > 0) {
    const d = c.calories.delta;
    parts.push(
      d === 0
        ? '섭취량은 지난주와 비슷했어요.'
        : `지난주보다 ${Math.abs(d).toLocaleString()}kcal ${d > 0 ? '더' : '덜'} 먹었어요.`,
    );
  }
  if (c.caloriesBurned.value > 0) {
    const d = c.caloriesBurned.delta;
    parts.push(
      c.caloriesBurned.prev === 0
        ? '이 주부터 운동 기록이 생겼어요.'
        : `운동 소모는 지난주보다 ${Math.abs(d).toLocaleString()}kcal ${d >= 0 ? '늘었어요' : '줄었어요'}.`,
    );
  }
  return parts.length > 0 ? parts : ['이 주 기록으로 다음 주 흐름을 만들어봐요.'];
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

export function InsightLead({
  week,
  weekKeys,
  data,
  count,
}: {
  week: number;
  weekKeys: string[];
  data: WeekComparison;
  count: number;
}) {
  const from = weekKeys[0];
  const to = weekKeys[weekKeys.length - 1];
  const range = from && to ? `${dateLabel(from)} – ${dateLabel(to)}` : '';
  const nextHref = week > 0 ? `/stats?week=${week - 1}` : null;

  return (
    <header className={STYLES.wrap}>
      <p className={STYLES.eyebrow}>
        <Link href={`/stats?week=${week + 1}`} className={STYLES.nav} aria-label="이전 주">
          <ChevronLeft size={15} />
        </Link>
        <span className={STYLES.dot} />
        <span>{weekName(week)}</span>
        <span className={STYLES.range}>· {range}</span>
        {nextHref ? (
          <Link href={nextHref} className={STYLES.nav} aria-label="다음 주">
            <ChevronRight size={15} />
          </Link>
        ) : (
          <span className={`${STYLES.nav} ${STYLES.navOff}`} aria-hidden>
            <ChevronRight size={15} />
          </span>
        )}
      </p>
      <h1 className={STYLES.feedback}>
        {feedbackLines(data, count).map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </h1>
      <p className={STYLES.suggestion}>{suggestionText(data, count)}</p>
    </header>
  );
}
