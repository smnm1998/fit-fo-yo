'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  dateLabel,
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
import { RecordCard } from '@/components/records/RecordCard';
import { RecordInput } from '@/components/records/RecordInput';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { useUiStore } from '@/lib/store/ui-store';
import { ViewToggle } from './ViewToggle';

const STYLES = {
  toolbar: 'flex items-center justify-between gap-3',
  monthNav: 'flex items-center gap-1',
  navBtn: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  month: 'text-base font-semibold text-foreground',
  splitGrid: 'grid gap-6 lg:grid-cols-[1fr_20rem]',
  monthCol: 'flex flex-col gap-6',
  skeleton: 'h-[22rem] animate-pulse rounded-lg bg-subtle',
  panel: 'flex flex-col gap-4',
  panelHead: 'text-sm font-semibold text-foreground',
  totals: 'grid grid-cols-3 gap-2',
  totalCard: 'rounded-lg border border-border bg-surface p-3',
  totalLabel: 'text-xs text-muted',
  totalValue: 'mt-0.5 text-sm font-semibold tabular-nums text-foreground',
  addHead: 'text-xs font-medium text-muted',
  list: 'flex flex-col gap-3',
  pending: 'rounded-lg border border-border bg-surface p-4',
  pendingRow: 'flex items-center justify-between gap-3',
  pendingRaw: 'text-sm text-foreground',
  pendingStatus: 'mt-0.5 text-xs text-muted',
  pendingErr: 'mt-0.5 text-xs text-danger',
  dismiss: 'shrink-0 text-xs font-medium text-muted hover:text-foreground',
  notice:
    'flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm text-danger',
  empty: 'py-6 text-center text-sm text-muted',
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
  const pending = useRecordsStore((s) => s.pending);
  const dismissPending = useRecordsStore((s) => s.dismissPending);
  const notice = useRecordsStore((s) => s.notice);
  const setNotice = useRecordsStore((s) => s.setNotice);

  const viewMode = useUiStore((s) => s.viewMode);

  // 월 기록을 스토어에 시드 → 점·패널·합계가 한 소스
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

  const monthNav = (
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
  );

  const calendar = showSkeleton ? (
    <div className={STYLES.skeleton} />
  ) : (
    <CalendarGrid month={month} records={monthRecords} selectedDate={date} onSelect={selectDate} />
  );

  const panel = (
    <div className={STYLES.panel}>
      <h3 className={STYLES.panelHead}>
        {dateLabel(date)}
        {date === todayKST() && ' · 오늘'}
      </h3>

      <div className={STYLES.totals}>
        <div className={STYLES.totalCard}>
          <p className={STYLES.totalLabel}>섭취</p>
          <p className={STYLES.totalValue}>{totals.calories.toLocaleString()} kcal</p>
        </div>
        <div className={STYLES.totalCard}>
          <p className={STYLES.totalLabel}>소모</p>
          <p className={STYLES.totalValue}>{totals.caloriesBurned.toLocaleString()} kcal</p>
        </div>
        <div className={STYLES.totalCard}>
          <p className={STYLES.totalLabel}>순</p>
          <p className={STYLES.totalValue}>
            {(totals.calories - totals.caloriesBurned).toLocaleString()} kcal
          </p>
        </div>
      </div>

      <RecommendationCard recommendation={dayRec} hideWhenEmpty />

      <div className="flex flex-col gap-2">
        <p className={STYLES.addHead}>기록 추가</p>
        <RecordInput recordedAt={dayNoonIsoKST(date)} />
      </div>

      {notice && (
        <div className={STYLES.notice}>
          <span>{notice}</span>
          <button type="button" className={STYLES.dismiss} onClick={() => setNotice(null)}>
            닫기
          </button>
        </div>
      )}

      <div className={STYLES.list}>
        {pending.map((p) => (
          <div key={p.tempId} className={STYLES.pending}>
            <div className={STYLES.pendingRow}>
              <div>
                <p className={STYLES.pendingRaw}>{p.rawInput}</p>
                {p.status === 'pending' ? (
                  <p className={STYLES.pendingStatus}>분석 중…</p>
                ) : (
                  <p className={STYLES.pendingErr}>{p.error}</p>
                )}
              </div>
              {p.status === 'error' && (
                <button
                  type="button"
                  className={STYLES.dismiss}
                  onClick={() => dismissPending(p.tempId)}
                >
                  닫기
                </button>
              )}
            </div>
          </div>
        ))}
        {dayRecords.length === 0 && pending.length === 0 ? (
          <p className={STYLES.empty}>이 날의 기록이 없어요. 위에서 추가해보세요.</p>
        ) : (
          dayRecords.map((r) => <RecordCard key={r.id} record={r} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={STYLES.toolbar}>
        {monthNav}
        <ViewToggle />
      </div>
      {viewMode === 'split' ? (
        <div className={STYLES.splitGrid}>
          {calendar}
          {panel}
        </div>
      ) : (
        <div className={STYLES.monthCol}>
          {calendar}
          {panel}
        </div>
      )}
    </div>
  );
}
