'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRecordsStore } from '@/lib/store/records-store';
import type { DayTotals } from '@/lib/records';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { buildDayEntries, type DayFilterValue } from './day-entries';
import { DayFilter } from './DayFilter';
import { RecordRow } from './RecordRow';
import { DayActions } from './DayActions';
import { RecordInfoModal } from './RecordInfoModal';
import { AddRecordModal } from './AddRecordModal';

const RECENT_LIMIT = 4;

const STYLES = {
  panel: 'flex h-full flex-col gap-4 animate-[viewInLeft_220ms_ease-out]',
  head: 'flex items-baseline gap-2',
  date: 'text-base font-bold text-foreground',
  today: 'rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-surface',

  feedback: 'flex flex-col gap-1 px-1',
  feedHead: 'flex items-center gap-1.5 text-[11px] font-semibold text-muted',
  feedText: 'text-sm leading-relaxed text-foreground',
  feedEmpty: 'text-sm leading-relaxed text-muted',

  totals: 'grid grid-cols-3 divide-x divide-border border-y border-border',
  totalCard: 'flex flex-col gap-1 px-3 py-3',
  totalLabel: 'text-[11px] text-muted',
  totalValue: 'text-sm font-bold tabular-nums',
  totalUnit: 'text-[11px] font-medium text-muted',

  listWrap: 'flex flex-col gap-2',
  rowList: 'flex flex-col gap-2',
  empty: 'rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted',
  toggle:
    'mx-auto flex items-center gap-0.5 text-xs font-medium text-muted transition-colors hover:text-foreground',

  notice:
    'flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm text-danger',
  dismiss: 'shrink-0 text-xs font-medium text-muted hover:text-foreground',
  footer: 'mt-auto',
} as const;

type Props = {
  dateLabelText: string;
  isToday: boolean;
  recordedAt: string;
  totals: DayTotals;
  dayRec: RecommendationDto | null;
  dayRecords: RecordDto[];
  onOpenChat: () => void;
};

export function DashboardView({
  dateLabelText,
  isToday,
  recordedAt,
  totals,
  dayRec,
  dayRecords,
  onOpenChat,
}: Props) {
  const [filter, setFilter] = useState<DayFilterValue>('ALL');
  const [expanded, setExpanded] = useState(false);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const notice = useRecordsStore((s) => s.notice);
  const setNotice = useRecordsStore((s) => s.setNotice);

  const net = totals.calories - totals.caloriesBurned;
  const entries = useMemo(() => buildDayEntries(dayRecords, filter), [dayRecords, filter]);
  const shown = expanded ? entries : entries.slice(0, RECENT_LIMIT);

  const dietRecords = useMemo(() => dayRecords.filter((r) => r.type === 'DIET'), [dayRecords]);
  const info = useMemo(() => {
    if (!infoKey) return null;
    if (infoKey.startsWith('meal:')) {
      if (dietRecords.length === 0) return null;
      return { records: dietRecords, tabs: true, defaultMeal: infoKey.slice(5), title: '식단' };
    }
    const record = dayRecords.find((r) => r.id === infoKey.slice(4));
    if (!record) return null;
    return { records: [record], tabs: false, defaultMeal: undefined, title: '운동' };
  }, [infoKey, dietRecords, dayRecords]);

  return (
    <div className={STYLES.panel}>
      <div className={STYLES.head}>
        <span className={STYLES.date}>{dateLabelText}</span>
        {isToday && <span className={STYLES.today}>오늘</span>}
      </div>

      <div className={STYLES.feedback}>
        <div className={STYLES.feedHead}>
          <Sparkles size={13} /> AI 피드백
        </div>
        {dayRec ? (
          <p className={STYLES.feedText}>{dayRec.payload.message}</p>
        ) : (
          <p className={STYLES.feedEmpty}>
            오늘 추천이 아직 없어요. 어제 기록이 있으면 아침에 준비돼요.
          </p>
        )}
      </div>

      <div className={STYLES.totals}>
        <Stat label="섭취" value={totals.calories} color="text-emerald-600 dark:text-emerald-400" />
        <Stat label="소모" value={totals.caloriesBurned} color="text-sky-600 dark:text-sky-400" />
        <Stat label="순" value={net} color="text-foreground" />
      </div>

      <div className={STYLES.listWrap}>
        <DayFilter
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setExpanded(false);
          }}
        />

        {entries.length === 0 ? (
          <p className={STYLES.empty}>아직 기록이 없어요</p>
        ) : (
          <div className={STYLES.rowList}>
            {shown.map((entry) => (
              <RecordRow key={entry.key} entry={entry} onOpen={() => setInfoKey(entry.key)} />
            ))}
          </div>
        )}

        {entries.length > RECENT_LIMIT && (
          <button type="button" className={STYLES.toggle} onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <>
                접기 <ChevronUp size={14} />
              </>
            ) : (
              <>
                더보기 ({entries.length}) <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </div>

      {notice && (
        <div className={STYLES.notice}>
          <span>{notice}</span>
          <button type="button" className={STYLES.dismiss} onClick={() => setNotice(null)}>
            닫기
          </button>
        </div>
      )}

      <div className={STYLES.footer}>
        <DayActions onManual={() => setAddOpen(true)} onAi={onOpenChat} />
      </div>

      {info && (
        <RecordInfoModal
          records={info.records}
          tabs={info.tabs}
          defaultMeal={info.defaultMeal}
          title={info.title}
          onClose={() => setInfoKey(null)}
        />
      )}

      {addOpen && (
        <AddRecordModal
          recordedAt={recordedAt}
          dateText={dateLabelText}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={STYLES.totalCard}>
      <span className={STYLES.totalLabel}>{label}</span>
      <span className={cn(STYLES.totalValue, color)}>
        {value.toLocaleString()}
        <span className={STYLES.totalUnit}> kcal</span>
      </span>
    </div>
  );
}
