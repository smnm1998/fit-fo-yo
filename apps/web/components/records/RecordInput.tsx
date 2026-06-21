'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { parseAndSave, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';

const STYLES = {
  form: 'flex flex-col gap-2',
  textarea:
    'min-h-20 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent',
  row: 'flex items-center justify-between gap-2',
  hint: 'text-xs text-muted',
} as const;

export function RecordInput() {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const addPending = useRecordsStore((s) => s.addPending);
  const resolvePending = useRecordsStore((s) => s.resolvePending);
  const failPending = useRecordsStore((s) => s.failPending);

  async function submit() {
    const text = value.trim();
    if (!text || submitting) return;
    const tempId = crypto.randomUUID();
    addPending({ tempId, rawInput: text, status: 'pending' });
    setValue('');
    setSubmitting(true);
    try {
      const record = await parseAndSave(text);
      resolvePending(tempId, record);
    } catch (err) {
      failPending(tempId, err instanceof ApiError ? err.message : '기록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form className={STYLES.form} onSubmit={onSubmit}>
      <textarea
        className={STYLES.textarea}
        placeholder="예) 점심에 닭가슴살 200g 먹음 / 30분 러닝함"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        maxLength={500}
        rows={2}
      />
      <div className={STYLES.row}>
        <span className={STYLES.hint}>{value.length}/500 · Enter 전송</span>
        <Button type="submit" disabled={submitting || value.trim().length === 0}>
          {submitting ? '분석 중...' : '기록'}
        </Button>
      </div>
    </form>
  );
}
