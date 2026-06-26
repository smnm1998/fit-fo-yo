'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { deleteRecord } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import type { DayTotals } from '@/lib/records';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { RecordRow } from './RecordRow';
import { RecordEditModal } from './RecordEditModal';

const RECENT_LIMIT = 3;
type Filter = 'DIET' | 'EXERCISE';

const STYLES = {
  panel: 'flex h-full flex-col gap-4',
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
  trashBtn: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-danger',
  headActions: 'flex items-center gap-3',
  headCancel: 'text-xs font-medium text-muted transition-colors hover:text-foreground',
  headDel:
    'text-xs font-semibold text-danger transition-opacity hover:opacity-70 disabled:opacity-40',
  rowList: 'flex flex-col gap-2',
  empty: 'rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted',
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
  totals: DayTotals;
  dayRec: RecommendationDto | null;
  dayRecords: RecordDto[];
  onOpenChat: () => void;
};

export function DashboardView({
  dateLabelText,
  isToday,
  totals,
  dayRec,
  dayRecords,
  onOpenChat,
}: Props) {
  const [filter, setFilter] = useState<Filter>('DIET');
  const [expanded, setExpanded] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<RecordDto | null>(null);
  const notice = useRecordsStore((s) => s.notice);
  const setNotice = useRecordsStore((s) => s.setNotice);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const restoreRecord = useRecordsStore((s) => s.restoreRecord);

  const filtered = dayRecords.filter((r) => r.type === filter);
  const shown = expanded ? filtered : filtered.slice(0, RECENT_LIMIT);
  const net = totals.calories - totals.caloriesBurned;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    const targets = dayRecords.filter((r) => selected.has(r.id));
    if (targets.length === 0) return;
    targets.forEach((r) => removeRecord(r.id));
    setSelected(new Set());
    setDeleteMode(false);

    const failures = await Promise.all(
      targets.map(async (r) => {
        try {
          await deleteRecord(r.id);
          return null;
        } catch {
          return r;
        }
      }),
    );
    const failed = failures.filter((r): r is RecordDto => r !== null);
    if (failed.length) {
      failed.forEach((r) => restoreRecord(r));
      setNotice('일부 기록을 삭제하지 못했어요.');
    }
  }

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
        <Stat label="섭취" value={totals.calories} color="text-emerald-600" />
        <Stat label="소모" value={totals.caloriesBurned} color="text-sky-600" />
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
                  setSelected(new Set());
                }}
                className={cn(STYLES.segBtn, filter === f && STYLES.segActive)}
              >
                {f === 'DIET' ? '식단' : '운동'}
              </button>
            ))}
          </div>
          {deleteMode ? (
            <div className={STYLES.headActions}>
              <button
                type="button"
                className={STYLES.headCancel}
                onClick={() => {
                  setDeleteMode(false);
                  setSelected(new Set());
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={STYLES.headDel}
                onClick={() => void deleteSelected()}
                disabled={selected.size === 0}
              >
                삭제{selected.size > 0 ? ` ${selected.size}` : ''}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={STYLES.trashBtn}
              onClick={() => setDeleteMode(true)}
              aria-label="삭제 모드"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className={STYLES.empty}>{filter === 'DIET' ? '식단' : '운동'} 기록이 없어요.</p>
        ) : (
          <div className={STYLES.rowList}>
            {shown.map((r) => (
              <RecordRow
                key={r.id}
                record={r}
                deleteMode={deleteMode}
                selected={selected.has(r.id)}
                onToggle={() => toggleSelect(r.id)}
                onEdit={() => setEditing(r)}
              />
            ))}
          </div>
        )}

        {filtered.length > RECENT_LIMIT && (
          <button type="button" className={STYLES.toggle} onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <>
                접기 <ChevronUp size={14} />
              </>
            ) : (
              <>
                더보기 ({filtered.length}) <ChevronDown size={14} />
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

      {editing && <RecordEditModal record={editing} onClose={() => setEditing(null)} />}
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
