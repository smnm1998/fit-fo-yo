'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MEAL_LABEL } from '@/lib/record-meta';
import { useRecordsStore } from '@/lib/store/records-store';
import type { DayTotals } from '@/lib/records';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { RecordInfoModal } from './RecordInfoModal';
import { AddRecordModal } from './AddRecordModal';

const RECENT_LIMIT = 3;
type Filter = 'DIET' | 'EXERCISE';
const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ETC'] as const;

type Entry = {
  key: string;
  title: string;
  label: string;
  summary: string;
  kcal: number;
  records: RecordDto[];
};

const STYLES = {
  panel: 'flex h-full flex-col gap-4 animate-[viewInLeft_220ms_ease-out]',
  head: 'flex items-baseline gap-2',
  date: 'text-base font-bold text-foreground',
  today: 'rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-surface',
  feedback: 'flex flex-col gap-1 px-1',
  feedHead: 'flex items-center gap-1.5 text-[11px] font-semibold text-muted',
  feedText: 'text-sm leading-relaxed text-foreground',
  feedEmpty: 'text-sm leading-relaxed text-muted',
  totals:
    'grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface',
  totalCard: 'flex flex-col gap-1 px-3 py-3.5',
  totalLabel: 'text-[11px] text-muted',
  totalValue: 'text-sm font-bold tabular-nums',
  totalUnit: 'text-[11px] font-medium text-muted',
  recentWrap: 'flex flex-col gap-2',
  recentHead: 'flex items-center justify-between gap-2',
  seg: 'flex w-fit items-center gap-0.5 rounded-lg bg-subtle p-0.5',
  segBtn: 'rounded-md px-3 py-1 text-xs font-medium text-muted transition-colors',
  segActive: 'bg-surface text-foreground shadow-sm',
  rowList: 'flex flex-col gap-2',
  row: 'flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-subtle',
  rowLabel: 'max-w-[55%] truncate text-sm font-semibold text-foreground',
  rowSummary: 'min-w-0 flex-1 truncate text-xs text-muted',
  rowKcal: 'shrink-0 text-xs font-semibold tabular-nums text-foreground',
  addRow:
    'flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted opacity-70 transition-all hover:border-accent hover:bg-subtle hover:text-foreground hover:opacity-100',
  toggle:
    'mx-auto flex items-center gap-0.5 text-xs font-medium text-muted transition-colors hover:text-foreground',
  notice:
    'flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm text-danger',
  dismiss: 'shrink-0 text-xs font-medium text-muted hover:text-foreground',
  cta: 'mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90',
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
  const [filter, setFilter] = useState<Filter>('DIET');
  const [expanded, setExpanded] = useState(false);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const notice = useRecordsStore((s) => s.notice);
  const setNotice = useRecordsStore((s) => s.setNotice);

  const net = totals.calories - totals.caloriesBurned;

  const entries = useMemo<Entry[]>(() => {
    const filtered = dayRecords.filter((r) => r.type === filter);
    if (filter === 'EXERCISE') {
      return filtered.map((r) => {
        const items = r.exerciseItems;
        const kcal = items.reduce((s, it) => s + (it.caloriesBurned ?? 0), 0);
        const first = items[0]?.name ?? '운동';
        const dur = items[0]?.durationMinutes;
        return {
          key: `rec:${r.id}`,
          title: first,
          label: first,
          summary: items.length > 1 ? `외 ${items.length - 1}개` : dur ? `${dur}분` : '',
          kcal,
          records: [r],
        };
      });
    }
    const groups: Record<string, RecordDto[]> = {};
    for (const r of filtered) {
      const meal = r.dietItems[0]?.mealType ?? 'ETC';
      (groups[meal] ??= []).push(r);
    }
    return MEAL_ORDER.filter((m) => groups[m]?.length).map((meal) => {
      const recs = groups[meal] ?? [];
      const items = recs.flatMap((r) => r.dietItems);
      const kcal = items.reduce((s, it) => s + (it.calories ?? 0), 0);
      const label = (MEAL_LABEL as Record<string, string>)[meal] ?? '기타';
      const first = items[0]?.name ?? '';
      return {
        key: `meal:${meal}`,
        title: label,
        label,
        summary: items.length > 1 ? `${first} 외 ${items.length - 1}개` : first,
        kcal,
        records: recs,
      };
    });
  }, [dayRecords, filter]);

  const shown = expanded ? entries : entries.slice(0, RECENT_LIMIT);
  const dietRecords = useMemo(() => dayRecords.filter((r) => r.type === 'DIET'), [dayRecords]);
  const info = useMemo(() => {
    if (!infoKey) return null;
    if (infoKey.startsWith('diet:')) {
      if (dietRecords.length === 0) return null;
      return { records: dietRecords, tabs: true, defaultMeal: infoKey.slice(5), title: '식단' };
    }
    const rec = dayRecords.find((r) => r.id === infoKey.slice(4));
    if (!rec) return null;
    return {
      records: [rec],
      tabs: false,
      defaultMeal: undefined,
      title: rec.exerciseItems[0]?.name ?? '운동',
    };
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

      <div className={STYLES.recentWrap}>
        <div className={STYLES.recentHead}>
          <div className={STYLES.seg}>
            {(['DIET', 'EXERCISE'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setExpanded(false);
                }}
                className={cn(STYLES.segBtn, filter === f && STYLES.segActive)}
              >
                {f === 'DIET' ? '식단' : '운동'}
              </button>
            ))}
          </div>
        </div>

        <div className={STYLES.rowList}>
          {shown.map((e) => (
            <button
              key={e.key}
              type="button"
              className={STYLES.row}
              onClick={() => setInfoKey(filter === 'DIET' ? `diet:${e.key.slice(5)}` : e.key)}
            >
              <span className={STYLES.rowLabel}>{e.label}</span>
              {e.summary && <span className={STYLES.rowSummary}>{e.summary}</span>}
              {e.kcal > 0 && <span className={STYLES.rowKcal}>{e.kcal.toLocaleString()} kcal</span>}
            </button>
          ))}
          <button type="button" className={STYLES.addRow} onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            {entries.length === 0
              ? `${filter === 'DIET' ? '식단' : '운동'} 기록 추가하기`
              : '추가하기'}
          </button>
        </div>

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

      <button type="button" className={STYLES.cta} onClick={onOpenChat}>
        <Sparkles size={16} /> AI로 입력하기
      </button>

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
