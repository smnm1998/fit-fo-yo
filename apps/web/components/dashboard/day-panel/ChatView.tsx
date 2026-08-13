'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Send, Salad, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import { aiChat, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { useChatStore, type ChatMsg, type ChatCard } from '@/lib/store/chat-store';
import { useTypewriter } from '@/lib/hooks/useTypewriter';
import { cn } from '@/lib/cn';
import { RECORD_TYPE_META, recordName, recordTotalKcal, recordMealLabel } from '@/lib/record-meta';
import type { AiChatTurn, RecordDto } from '@/lib/types';

const EMPTY: ChatMsg[] = [];
const GLOW = 'drop-shadow-[0_1px_5px_rgba(16,185,129,0.30)]';

const S = {
  panel:
    'relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background animate-[viewInRight_220ms_ease-out]',

  head: 'flex items-center gap-2 px-3.5 py-3',
  back: 'grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-subtle',
  clear:
    'ml-auto rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground',
  body: 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-32 pt-1',

  hint: 'm-auto flex max-w-[15rem] flex-col items-center gap-3 text-center',
  hintTitle: 'mt-1 text-sm font-bold text-foreground',
  hintText: 'text-xs leading-relaxed text-muted',

  turn: 'flex flex-col gap-2.5 animate-[slideUpIn_240ms_ease-out]',
  userMsg:
    'ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[16px_16px_5px_16px] bg-accent px-3.5 py-2 text-xs leading-relaxed text-surface',
  bot: 'flex max-w-[92%] items-start gap-2.5',
  botMark: cn('mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400', GLOW),
  botContent: 'flex min-w-0 flex-col gap-2.5',
  botText: 'text-[13px] leading-relaxed text-foreground',
  botError: 'text-[13px] text-danger',

  gen: 'flex items-center gap-2.5 text-xs text-muted',
  genIcon: cn('grid place-items-center text-emerald-500 dark:text-emerald-400', GLOW),
  genInner: 'inline-grid origin-center animate-[genPulse_3.4s_ease-in-out_infinite]',

  card: 'flex min-w-[240px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5',
  cardRemoved: 'border-dashed opacity-60',
  cardIco: 'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
  cardMain: 'flex min-w-0 flex-1 flex-col gap-0.5',
  cardTop: 'flex items-center gap-1.5',
  cardName: 'truncate text-[13px] font-bold text-foreground',
  cardNameDel: 'truncate text-[13px] font-semibold text-muted line-through',
  cardMeal: 'shrink-0 rounded-full bg-subtle px-1.5 py-0.5 text-[10px] font-semibold text-muted',
  cardSub: 'flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted',
  badgeEst: 'rounded-full border border-border px-1.5 text-[10px] font-semibold text-muted',
  tagDel: 'ml-auto shrink-0 text-[10.5px] font-semibold text-danger',

  dock: 'absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-4 pb-4 pt-10',
  suggestWrap: 'flex flex-col items-end gap-1.5',
  suggestGrid: 'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
  suggestList: 'flex min-h-0 flex-col items-end gap-1.5 overflow-hidden',
  suggestToggle:
    'inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted shadow-[0_2px_8px_-5px_rgba(0,0,0,0.18)] transition-colors hover:bg-subtle hover:text-foreground',
  sGhost:
    'w-full cursor-pointer rounded-[16px_16px_5px_16px] border border-dashed border-border bg-transparent px-3.5 py-2 text-left text-xs text-muted transition-colors hover:border-solid hover:border-accent hover:bg-surface hover:text-foreground disabled:opacity-50 animate-[chipRise_400ms_ease-out_both]',
  suggest: 'flex flex-col gap-1.5',
  sRow: 'flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-xs text-foreground shadow-[0_2px_8px_-5px_rgba(0,0,0,0.15)] transition-colors hover:bg-subtle disabled:opacity-50 animate-[chipRise_400ms_ease-out_both]',
  sRowText: 'truncate',
  sRowGo: 'ml-auto shrink-0 text-muted',
  chip: 'shrink-0 animate-[chipRise_400ms_ease-out_both] rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs text-muted shadow-[0_2px_8px_-4px_rgba(0,0,0,0.18)] transition-colors hover:border-muted hover:bg-subtle hover:text-foreground disabled:opacity-50',
  input:
    'flex items-end gap-2 rounded-[22px] border border-border bg-surface p-1.5 pl-4 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.25)] transition-colors focus-within:border-accent',
  textarea:
    'max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted',
  send: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-surface transition-opacity hover:opacity-90 disabled:opacity-40',
} as const;

function AiMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2 L15.5 8.5 L22 12 L15.5 15.5 L12 22 L8.5 15.5 L2 12 L8.5 8.5 Z" />
    </svg>
  );
}

function dtoToCard(r: RecordDto, kind: 'created' | 'updated'): ChatCard {
  const items = r.type === 'DIET' ? r.dietItems : r.exerciseItems;
  const estimated = items.some((i) => i.estimated);
  if (r.type === 'DIET') {
    return {
      kind,
      type: 'DIET',
      name: recordName(r),
      meal: recordMealLabel(r),
      detail: `${recordTotalKcal(r)} kcal`,
      estimated,
    };
  }
  const mins = r.exerciseItems.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
  return {
    kind,
    type: 'EXERCISE',
    name: recordName(r),
    detail: `${mins}분 · ${recordTotalKcal(r)} kcal 소모`,
    estimated,
  };
}

type Props = { dateLabelText: string; recordedAt: string; onBack: () => void };

export function ChatView({ recordedAt, onBack }: Props) {
  const messages = useChatStore((s) => s.byDate[recordedAt] ?? EMPTY);
  const append = useChatStore((s) => s.append);
  const patch = useChatStore((s) => s.patch);
  const clear = useChatStore((s) => s.clear);

  const [showSuggest, setShowSuggest] = useState(true);
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const addRecord = useRecordsStore((s) => s.addRecord);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const removeRecord = useRecordsStore((s) => s.removeRecord);

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

  async function send(overrideText?: string) {
    const text = (overrideText ?? value).trim();
    if (!text || sending) return;

    const history: AiChatTurn[] = [];
    for (const m of messages) {
      history.push({ role: 'user', content: m.text });
      if (m.reply) history.push({ role: 'assistant', content: m.reply });
    }
    history.push({ role: 'user', content: text });

    const id = crypto.randomUUID();
    freshIds.current.add(id);
    append(recordedAt, { id, text, status: 'pending' });
    setValue('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setSending(true);
    try {
      const res = await aiChat(history, recordedAt);
      const prev = useRecordsStore.getState().records;
      const cards: ChatCard[] = [];
      res.mutations.created.forEach((r) => {
        addRecord(r);
        cards.push(dtoToCard(r, 'created'));
      });
      res.mutations.updated.forEach((r) => {
        updateRecord(r);
        cards.push(dtoToCard(r, 'updated'));
      });
      res.mutations.deletedIds.forEach((rid) => {
        const rec = prev.find((r) => r.id === rid);
        if (rec)
          cards.push({
            kind: 'removed',
            type: rec.type,
            name: recordName(rec),
            detail: '기록에서 삭제됨',
          });
        removeRecord(rid);
      });
      patch(recordedAt, id, {
        status: 'done',
        reply: res.reply,
        suggestions: res.suggestions,
        cards,
      });
    } catch (err) {
      const error = err instanceof ApiError ? err.message : '기록에 실패했어요.';
      patch(recordedAt, id, { status: 'error', error });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  const lastMsg = messages[messages.length - 1];
  const suggestions =
    !sending && lastMsg && lastMsg.status === 'done' ? (lastMsg.suggestions ?? []) : [];

  return (
    <div className={S.panel}>
      <div className={S.head}>
        <button type="button" onClick={onBack} className={S.back} aria-label="뒤로">
          <ArrowLeft size={17} strokeWidth={2.1} />
        </button>
        {messages.length > 0 && (
          <button type="button" className={S.clear} onClick={() => clear(recordedAt)}>
            기록 지우기
          </button>
        )}
      </div>

      <div className={S.body}>
        {messages.length === 0 ? (
          <div className={S.hint}>
            <AiMark size={38} className={cn('text-emerald-500 dark:text-emerald-400', GLOW)} />
            <p className={S.hintTitle}>무엇을 드셨나요?</p>
            <p className={S.hintText}>
              먹은 것·운동을 말하듯 적으면 기록돼요.
              <br />
              수정·삭제도 말로 하면 됩니다.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={S.turn}>
              <div className={S.userMsg}>{m.text}</div>

              {m.status === 'pending' && (
                <div className={S.gen}>
                  <span className={S.genIcon}>
                    <span className={S.genInner}>
                      <AiMark size={19} />
                    </span>
                  </span>
                  <span>생성 중이에요…</span>
                </div>
              )}

              {m.status === 'done' && (
                <div className={S.bot}>
                  <span className={S.botMark}>
                    <AiMark size={20} />
                  </span>
                  <div className={S.botContent}>
                    {m.reply && <BotText text={m.reply} animate={freshIds.current.has(m.id)} />}
                    {m.cards?.map((c, i) => (
                      <RecCard key={i} card={c} />
                    ))}
                  </div>
                </div>
              )}

              {m.status === 'error' && (
                <div className={S.bot}>
                  <span className={S.botMark}>
                    <AiMark size={20} />
                  </span>
                  <p className={S.botError}>{m.error}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div
        className={S.dock}
        style={{ background: 'linear-gradient(to top, var(--background) 56%, transparent)' }}
      >
        {suggestions.length > 0 && (
          <div className={S.suggestWrap}>
            <button
              type="button"
              className={S.suggestToggle}
              onClick={() => setShowSuggest((v) => !v)}
              aria-expanded={showSuggest}
            >
              추천 {showSuggest ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
            <div
              className={cn(
                S.suggestGrid,
                showSuggest ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className={S.suggestList}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className={S.sGhost}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => void send(s)}
                    disabled={sending}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={S.input}>
          <textarea
            ref={taRef}
            className={S.textarea}
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
            className={S.send}
            aria-label="전송"
          >
            <Send size={16} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RecCard({ card }: { card: ChatCard }) {
  const removed = card.kind === 'removed';
  const Icon = card.type === 'DIET' ? Salad : Activity;
  return (
    <div className={cn(S.card, removed && S.cardRemoved)}>
      <span
        className={cn(
          S.cardIco,
          removed ? 'bg-subtle text-muted' : RECORD_TYPE_META[card.type].badgeSoft,
        )}
      >
        {removed ? <Trash2 size={16} /> : <Icon size={17} />}
      </span>
      <div className={S.cardMain}>
        <div className={S.cardTop}>
          <span className={removed ? S.cardNameDel : S.cardName}>{card.name}</span>
          {!removed && card.meal && <span className={S.cardMeal}>{card.meal}</span>}
        </div>
        <div className={S.cardSub}>
          <span className={removed ? undefined : 'font-semibold text-foreground'}>
            {card.detail}
          </span>
          {!removed && card.estimated && <span className={S.badgeEst}>추정</span>}
        </div>
      </div>
      {removed && <span className={S.tagDel}>삭제</span>}
    </div>
  );
}

function BotText({ text, animate }: { text: string; animate: boolean }) {
  const shown = useTypewriter(text, animate);
  return <p className={S.botText}>{shown}</p>;
}
