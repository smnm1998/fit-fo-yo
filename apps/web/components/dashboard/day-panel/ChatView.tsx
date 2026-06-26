'use client';

import { useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { parseAndSave, ApiError } from '@/lib/client/records-api';
import { recordSummary } from '@/lib/record-meta';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';

const STYLES = {
  panel: 'flex h-full flex-col gap-4',
  head: 'flex items-center gap-2',
  back: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  title: 'truncate text-sm font-semibold text-foreground',
  body: 'flex min-h-[14rem] flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-3',
  hint: 'm-auto text-center text-xs leading-relaxed text-muted',
  turn: 'flex flex-col gap-1',
  userMsg:
    'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-1.5 text-xs leading-relaxed text-surface',
  botMsg:
    'mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-subtle px-3 py-1.5 text-xs leading-relaxed',
  botPending: 'text-muted',
  botDone: 'text-foreground',
  botError: 'text-danger',
  inputRow: 'flex items-end gap-2',
  textarea:
    'max-h-32 min-h-[2.5rem] w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent',
  send: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-surface transition-opacity hover:opacity-90 disabled:opacity-40',
} as const;

type ChatMsg = {
  id: string;
  text: string;
  status: 'pending' | 'done' | 'error';
  record?: RecordDto;
  error?: string;
};

type Props = { dateLabelText: string; recordedAt: string; onBack: () => void };

export function ChatView({ dateLabelText, recordedAt, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const addRecord = useRecordsStore((s) => s.addRecord);

  async function send() {
    const text = value.trim();
    if (!text || sending) return;
    const id = crypto.randomUUID();
    setMessages((m) => [...m, { id, text, status: 'pending' }]);
    setValue('');
    setSending(true);
    try {
      const record = await parseAndSave(text, recordedAt);
      addRecord(record);
      setMessages((m) =>
        m.map((msg) => (msg.id === id ? { ...msg, status: 'done', record } : msg)),
      );
    } catch (err) {
      const error = err instanceof ApiError ? err.message : '기록에 실패했어요.';
      setMessages((m) =>
        m.map((msg) => (msg.id === id ? { ...msg, status: 'error', error } : msg)),
      );
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className={STYLES.panel}>
      <div className={STYLES.head}>
        <button type="button" onClick={onBack} className={STYLES.back} aria-label="뒤로">
          <ArrowLeft size={18} />
        </button>
        <span className={STYLES.title}>AI로 기록 · {dateLabelText}</span>
      </div>

      <div className={STYLES.body}>
        {messages.length === 0 ? (
          <p className={STYLES.hint}>
            음식이나 운동을 자연어로 입력하면 자동으로 기록돼요.
            <br />
            예) 점심에 비빔밥 먹음 / 30분 러닝
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={STYLES.turn}>
              <div className={STYLES.userMsg}>{m.text}</div>
              <div className={STYLES.botMsg}>
                {m.status === 'pending' && <span className={STYLES.botPending}>분석 중…</span>}
                {m.status === 'done' && m.record && (
                  <span className={STYLES.botDone}>✅ {recordSummary(m.record)}</span>
                )}
                {m.status === 'error' && <span className={STYLES.botError}>{m.error}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={STYLES.inputRow}>
        <textarea
          className={STYLES.textarea}
          placeholder="예) 점심에 비빔밥 먹음"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={500}
          rows={2}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || value.trim().length === 0}
          className={STYLES.send}
          aria-label="전송"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
