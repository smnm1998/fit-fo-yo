'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  dateLabelDow,
  dayKeyKST,
  dayNoonIsoKST,
  monthLabel,
  monthRangeKST,
  shiftMonth,
  todayKST,
} from '@/lib/date';
import { fetchRecords } from '@/lib/client/records-api';
import { fetchRecommendations } from '@/lib/client/recommendations-api';
import { useDelayedFlag } from '@/lib/hooks/useDelayedFlag';
import { useRecordsStore } from '@/lib/store/records-store';
import { sumRecords } from '@/lib/records';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DayPanel } from '@/components/dashboard/day-panel/DayPanel';
import type { RecommendationDto, RecordDto } from '@/lib/types';

const STYLES = {
  toolbar: 'flex items-center justify-between gap-3',
  monthNav:
    'flex items-center gap-0.5 rounded-full border border-border bg-foreground/15 p-0.5 backdrop-blur-sm',
  navBtn:
    'rounded-full p-1 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground',
  month: 'min-w-[6rem] text-center text-sm font-semibold text-foreground',
  splitGrid: 'grid gap-6 lg:grid-cols-[1fr_20rem]',
  skeleton: 'h-[22rem] animate-pulse rounded-2xl bg-subtle',
} as const;

type Props = {
  initialMonth: string;
  initialDate: string;
  initialRecords: RecordDto[];
  initialRecommendations: RecommendationDto[];
};

export function CalendarWorkspace({
  initialMonth,
  initialDate,
  initialRecords,
  initialRecommendations,
}: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [date, setDate] = useState(initialDate);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useDelayedFlag(loading);

  const records = useRecordsStore((s) => s.records);
  const setRecords = useRecordsStore((s) => s.setRecords);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setRecords(initialRecords);
    setHydrated(true);
  }, [initialRecords, setRecords]);
  const monthRecords = hydrated ? records : initialRecords;

  function syncUrl(m: string, d: string) {
    window.history.replaceState(null, '', `/dashboard?month=${m}&date=${d}`);
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

  const dayRecords = useMemo(
    () =>
      monthRecords
        .filter((r) => dayKeyKST(r.recordedAt) === date)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [monthRecords, date],
  );
  const dayRec = useMemo(
    () => recommendations.find((r) => dayKeyKST(r.forDate) === date) ?? null,
    [recommendations, date],
  );
  const totals = sumRecords(dayRecords);

  const calendar = showSkeleton ? (
    <div className={STYLES.skeleton} />
  ) : (
    <CalendarGrid month={month} records={monthRecords} selectedDate={date} onSelect={selectDate} />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={STYLES.toolbar}>
        <div className={STYLES.monthNav}>
          <button
            type="button"
            className={STYLES.navBtn}
            onClick={() => changeMonth(shiftMonth(month, -1))}
            aria-label="이전 달"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className={STYLES.month}>{monthLabel(month)}</h2>
          <button
            type="button"
            className={STYLES.navBtn}
            onClick={() => changeMonth(shiftMonth(month, 1))}
            aria-label="다음 달"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className={STYLES.splitGrid}>
        {calendar}
        <DayPanel
          dateLabelText={dateLabelDow(date)}
          isToday={date === todayKST()}
          recordedAt={dayNoonIsoKST(date)}
          totals={totals}
          dayRec={dayRec}
          dayRecords={dayRecords}
        />
      </div>
    </div>
  );
}
