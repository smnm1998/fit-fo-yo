'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  currentMonthKST,
  dateLabelDow,
  dayKeyKST,
  dayNoonIsoKST,
  monthLabel,
  shiftMonth,
  todayKST,
} from '@/lib/date';
import { useRecordsStore } from '@/lib/store/records-store';
import { sumRecords } from '@/lib/records';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DayPanel } from '@/components/dashboard/day-panel/DayPanel';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { fetchMonthData } from '@/lib/client/month-api';

const STYLES = {
  toolbar: 'flex items-center gap-2',
  navBtn:
    'grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-muted hover:text-foreground',
  month: 'px-1 text-lg font-bold tabular-nums text-foreground',
  todayBtn:
    'ml-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground',
  splitGrid: 'grid items-start gap-6 lg:grid-cols-[1fr_24rem]',
  skeleton: 'h-[22rem] animate-pulse rounded-2xl bg-subtle',
} as const;

type MonthEntry = { records: RecordDto[]; recs: RecommendationDto[] };

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

  const records = useRecordsStore((s) => s.records);
  const setRecords = useRecordsStore((s) => s.setRecords);

  // 월별 스냅샷 캐시 (재방문/인접 이동 즉시) + 레이스 가드용 현재 월 ref
  const cache = useRef(new Map<string, MonthEntry>());
  const monthRef = useRef(initialMonth);
  if (!cache.current.has(initialMonth)) {
    cache.current.set(initialMonth, { records: initialRecords, recs: initialRecommendations });
  }

  const [hydrated, setHydrated] = useState(false);
  const monthRecords = hydrated ? records : initialRecords;

  const inflight = useRef(new Map<string, Promise<MonthEntry>>());

  const fetchMonth = useCallback((m: string): Promise<MonthEntry> => {
    const existing = inflight.current.get(m);
    if (existing) return existing; // 진행 중인 같은 달 fetch 재사용 (프리페치+이동 중복 방지)
    const p = (async () => {
      const { records, recommendations } = await fetchMonthData(m);
      const entry: MonthEntry = { records, recs: recommendations };
      cache.current.set(m, entry);
      return entry;
    })().finally(() => inflight.current.delete(m));
    inflight.current.set(m, p);
    return p;
  }, []);

  // 마운트: store 하이드레이션 + 인접 월(±1) 유휴 프리페치
  useEffect(() => {
    setRecords(initialRecords);
    setHydrated(true);
    for (const adj of [shiftMonth(initialMonth, -1), shiftMonth(initialMonth, 1)]) {
      if (!cache.current.has(adj)) void fetchMonth(adj).catch(() => {});
    }
  }, [initialMonth, initialRecords, setRecords, fetchMonth]);

  function syncUrl(m: string, d: string) {
    window.history.replaceState(null, '', `/dashboard?month=${m}&date=${d}`);
  }

  function changeMonth(next: string) {
    // 떠나는 달의 현재 store 스냅샷을 캐시에 저장 (낙관적 변경 반영 → 재방문 시 최신)
    cache.current.set(monthRef.current, {
      records: useRecordsStore.getState().records,
      recs: recommendations,
    });

    setMonth(next);
    monthRef.current = next;
    syncUrl(next, date);

    // 다음 달의 인접(±1) 프리페치
    for (const adj of [shiftMonth(next, -1), shiftMonth(next, 1)]) {
      if (!cache.current.has(adj)) void fetchMonth(adj).catch(() => {});
    }

    const cached = cache.current.get(next);
    if (cached) {
      setRecords(cached.records);
      setRecommendations(cached.recs);
      setLoading(false);
      return; // 캐시 히트 → 즉시
    }

    setLoading(true);
    fetchMonth(next)
      .then((entry) => {
        if (monthRef.current !== next) return; // 이미 다른 달로 이동함 → 무시
        setRecords(entry.records);
        setRecommendations(entry.recs);
      })
      .catch(() => {
        if (monthRef.current !== next) return;
        setRecords([]);
        setRecommendations([]);
      })
      .finally(() => {
        if (monthRef.current === next) setLoading(false);
      });
  }

  function selectDate(next: string) {
    setDate(next);
    syncUrl(month, next);
  }

  function goToday() {
    const tMonth = currentMonthKST();
    const tDate = todayKST();
    setDate(tDate);
    if (tMonth !== month) changeMonth(tMonth);
    syncUrl(tMonth, tDate);
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

  const calendar = loading ? (
    <div className={STYLES.skeleton} />
  ) : (
    <CalendarGrid month={month} records={monthRecords} selectedDate={date} onSelect={selectDate} />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={STYLES.toolbar}>
        <button
          type="button"
          className={STYLES.navBtn}
          onClick={() => changeMonth(shiftMonth(month, -1))}
          aria-label="이전 달"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className={STYLES.month}>{monthLabel(month)}</h2>
        <button
          type="button"
          className={STYLES.navBtn}
          onClick={() => changeMonth(shiftMonth(month, 1))}
          aria-label="다음 달"
        >
          <ChevronRight size={18} />
        </button>
        <button type="button" className={STYLES.todayBtn} onClick={goToday}>
          오늘
        </button>
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
