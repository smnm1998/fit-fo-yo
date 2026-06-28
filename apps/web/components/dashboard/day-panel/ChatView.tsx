'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { parseAndSave, ApiError } from '@/lib/client/records-api';
import { recordSummary } from '@/lib/record-meta';
import { useRecordsStore } from '@/lib/store/records-store';
import { useChatStore, type ChatMsg } from '@/lib/store/chat-store';
import { useTypewriter } from '@/lib/hooks/useTypewriter';

const EMPTY: ChatMsg[] = [];

const STYLES = {
  panel: 'flex h-full flex-col gap-3 animate-[viewInRight_220ms_ease-out]',
  head: 'flex items-center gap-2',
  back: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  title: 'truncate text-sm font-semibold text-foreground',
  clear:
    'ml-auto rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground',
  body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-4',
  hint: 'm-auto text-center text-xs leading-relaxed text-muted',
  turn: 'flex flex-col gap-1.5 animate-[slideUpIn_240ms_ease-out]',
  userMsg:
    'ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-xs leading-relaxed text-surface',
  botMsg:
    'mr-auto max-w-[85%] break-words rounded-2xl rounded-bl-sm bg-subtle px-3.5 py-2 text-xs leading-relaxed',
  botDone: 'text-foreground',
  botError: 'text-danger',
  typing: 'inline-flex items-center gap-1 py-0.5',
  dot: 'h-1.5 w-1.5 rounded-full bg-muted animate-[blink_1.2s_ease-in-out_infinite]',
  inputRow:
    'flex items-end gap-1 rounded-[1.75rem] border border-border bg-surface p-1.5 transition-colors focus-within:border-accent',
  textarea:
    'max-h-32 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted',
  send: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-surface transition-opacity hover:opacity-90 disabled:opacity-40',
} as const;

type Props = { dateLabelText: string; recordedAt: string; onBack: () => void };

export function ChatView({ dateLabelText, recordedAt, onBack }: Props) {
  const messages = useChatStore((s) => s.byDate[recordedAt] ?? EMPTY);
  const append = useChatStore((s) => s.append);
  const patch = useChatStore((s) => s.patch);
  const clear = useChatStore((s) => s.clear);

  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const addRecord = useRecordsStore((s) => s.addRecord);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const freshIds = useRef<Set<string>>(new Set());

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  function autoResize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function send() {
    const text = value.trim();
    if (!text || sending) return;
    const id = crypto.randomUUID();
    freshIds.current.add(id);
    append(recordedAt, { id, text, status: 'pending' });
    setValue('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setSending(true);
    try {
      const record = await parseAndSave(text, recordedAt);
      addRecord(record);
      patch(recordedAt, id, { status: 'done', summary: recordSummary(record) });
    } catch (err) {
      const error = err instanceof ApiError ? err.message : '기록에 실패했어요.';
      patch(recordedAt, id, { status: 'error', error });
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
        {messages.length > 0 && (
          <button type="button" className={STYLES.clear} onClick={() => clear(recordedAt)}>
            기록 지우기
          </button>
        )}
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
                {m.status === 'pending' && (
                  <span className={STYLES.typing} aria-label="분석 중">
                    <span className={STYLES.dot} style={{ animationDelay: '0ms' }} />
                    <span className={STYLES.dot} style={{ animationDelay: '160ms' }} />
                    <span className={STYLES.dot} style={{ animationDelay: '320ms' }} />
                  </span>
                )}
                {m.status === 'done' && m.summary && (
                  <BotSummary text={`✅ ${m.summary}`} animate={freshIds.current.has(m.id)} />
                )}
                {m.status === 'error' && <span className={STYLES.botError}>{m.error}</span>}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className={STYLES.inputRow}>
        <textarea
          ref={taRef}
          className={STYLES.textarea}
          placeholder="예) 점심에 비빔밥 먹음"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={onKeyDown}
          maxLength={500}
          rows={1}
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

function BotSummary({ text, animate }: { text: string; animate: boolean }) {
  const shown = useTypewriter(text, animate);
  return <span className={STYLES.botDone}>{shown}</span>;
}
