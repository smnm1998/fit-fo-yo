'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateLabel, dayKeyKST, monthLabel, monthRangeKST, shiftMonth } from '@/lib/date';
import { fetchRecords } from '@/lib/client/records-api';
import { useDelayedFlag } from '@/lib/hooks/useDelayedFlag';
import { RecordCard } from '@/components/records/RecordCard';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { CalendarGrid } from './CalendarGrid';
import { fetchRecommendations } from '@/lib/client/recommendations-api';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';

const STYLES = {
  wrap: 'mx-auto flex max-w-md flex-col gap-4',
  header: 'flex items-center justify-between',
  navBtn: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  month: 'text-base font-semibold text-foreground',
  skeleton: 'h-[22rem] animate-pulse rounded-lg bg-subtle',
  dayHead: 'mb-2 text-sm font-medium text-foreground',
  list: 'flex flex-col gap-3',
  empty: 'py-8 text-center text-sm text-muted',
} as const;

type CalendarViewProps = {
  initialMonth: string;
  initialDate: string;
  initialRecords: RecordDto[];
  initialRecommendations: RecommendationDto[];
};

export function CalendarView({
  initialMonth,
  initialDate,
  initialRecords,
  initialRecommendations,
}: CalendarViewProps) {
  const [month, setMonth] = useState(initialMonth);
  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useDelayedFlag(loading);
  const [recommendations, setRecommendations] = useState(initialRecommendations);

  function syncUrl(m: string, d: string) {
    window.history.replaceState(null, '', `/calendar?month=${m}&date=${d}`);
  }

  async function changeMonth(next: string) {
    setMonth(next);
    syncUrl(next, date);
    setLoading(true);
    try {
      const { from, to } = monthRangeKST(next);
      const [recs, recoms] = await Promise.all([
        fetchRecords(from, to),
        fetchRecommendations(from, to),
      ]);
      setRecords(recs);
      setRecommendations(recoms);
    } catch {
      setRecords([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  function selectDate(next: string) {
    setDate(next);
    syncUrl(month, next);
  }

  const dayRecrods = useMemo(
    () =>
      records
        .filter((r) => dayKeyKST(r.recordedAt) === date)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [records, date],
  );

  const dayRec = useMemo(
    () => recommendations.find((r) => dayKeyKST(r.forDate) === date) ?? null,
    [recommendations, date],
  );

  return (
    <div className={STYLES.wrap}>
      <div className={STYLES.header}>
        <button
          type="button"
          className={STYLES.navBtn}
          onClick={() => changeMonth(shiftMonth(month, -1))}
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className={STYLES.month}>{monthLabel(month)}</h1>
        <button
          type="button"
          className={STYLES.navBtn}
          onClick={() => changeMonth(shiftMonth(month, 1))}
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {showSkeleton ? (
        <div className={STYLES.skeleton} />
      ) : (
        <CalendarGrid month={month} records={records} selectedDate={date} onSelect={selectDate} />
      )}

      <RecommendationCard recommendation={dayRec} hideWhenEmpty />

      <div>
        <h2 className={STYLES.dayHead}>{dateLabel(date)} 기록</h2>
        {dayRecrods.length === 0 ? (
          <p className={STYLES.empty}>이 날의 기록이 없어요.</p>
        ) : (
          <div className={STYLES.list}>
            {dayRecrods.map((r) => (
              <RecordCard key={r.id} record={r} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
