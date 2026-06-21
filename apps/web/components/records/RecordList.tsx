'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useRecordsStore } from '@/lib/store/records-store';
import { RecordCard } from './RecordCard';
import type { RecordDto } from '@/lib/types';

const STYLES = {
  list: 'flex flex-col gap-3',
  empty: 'py-10 text-center text-sm text-muted',
  notice:
    'flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2 text-sm text-danger',
  noticeClose: 'shrink-0 text-xs font-medium text-muted hover:text-foreground',
  pending: 'flex items-center justify-between gap-3',
  raw: 'text-sm text-foreground',
  status: 'mt-0.5 text-xs text-muted',
  error: 'mt-0.5 text-xs text-danger',
  dismiss: 'shrink-0 text-xs font-medium text-muted hover:text-foreground',
} as const;

export function RecordList({ initial }: { initial: RecordDto[] }) {
  const records = useRecordsStore((s) => s.records);
  const pending = useRecordsStore((s) => s.pending);
  const dismissPending = useRecordsStore((s) => s.dismissPending);
  const notice = useRecordsStore((s) => s.notice);
  const setNotice = useRecordsStore((s) => s.setNotice);
  const setRecords = useRecordsStore((s) => s.setRecords);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setRecords(initial); // 클라이언트에서만 스토어 시드
    setHydrated(true);
  }, [initial, setRecords]);

  const items = hydrated ? records : initial; // 첫 페인트는 SSR 데이터 그대로

  if (items.length === 0 && pending.length === 0) {
    return <p className={STYLES.empty}>아직 오늘 기록이 없어요. 위에 입력해보세요.</p>;
  }

  return (
    <div className={STYLES.list}>
      {notice && (
        <div className={STYLES.notice}>
          <span>{notice}</span>
          <button type="button" className={STYLES.noticeClose} onClick={() => setNotice(null)}>
            닫기
          </button>
        </div>
      )}
      {pending.map((p) => (
        <Card key={p.tempId}>
          <div className={STYLES.pending}>
            <div>
              <p className={STYLES.raw}>{p.rawInput}</p>
              {p.status === 'pending' ? (
                <p className={STYLES.status}>분석 중…</p>
              ) : (
                <p className={STYLES.error}>{p.error}</p>
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
        </Card>
      ))}
      {items.map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </div>
  );
}
