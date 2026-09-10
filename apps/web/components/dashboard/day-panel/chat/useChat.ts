import { useRef, useState } from 'react';
import type { AiChatTurn } from '@/lib/types';
import { aiChat, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { useChatStore, type ChatCard, type ChatMsg } from '@/lib/store/chat-store';
import { dtoToCard, removedCard } from './chat-card';

const EMPTY: ChatMsg[] = [];

/** 저장 턴들 + 이번 입력을 서버로 보낼 대화 이력 */
function toHistory(messages: ChatMsg[], next: string): AiChatTurn[] {
  const turns: AiChatTurn[] = [];

  for (const m of messages) {
    turns.push({ role: 'user', content: m.text });
    if (m.reply) turns.push({ role: 'assistant', content: m.reply });
  }

  turns.push({ role: 'user', content: next });
  return turns;
}

/**
 * 날짜별 AI 채팅
 * - 대화 이력은 chat-store(sessionStorage), 기록 목록 반영은 records-store
 * - 뷰는 이 훅이 주는 값만 그림
 */
export function useChat(recordedAt: string) {
  const messages = useChatStore((s) => s.byDate[recordedAt] ?? EMPTY);
  const append = useChatStore((s) => s.append);
  const patch = useChatStore((s) => s.patch);
  const clearDate = useChatStore((s) => s.clear);

  const addRecord = useRecordsStore((s) => s.addRecord);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const removeRecord = useRecordsStore((s) => s.removeRecord);

  const [sending, setSending] = useState(false);
  const freshIds = useRef<Set<string>>(new Set());

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    const history = toHistory(messages, text);
    const id = crypto.randomUUID();
    freshIds.current.add(id);
    append(recordedAt, { id, text, status: 'pending' });
    setSending(true);

    try {
      const res = await aiChat(history, recordedAt);
      const before = useRecordsStore.getState().records;
      const cards: ChatCard[] = [];

      for (const record of res.mutations.created) {
        addRecord(record);
        cards.push(dtoToCard(record, 'created'));
      }

      for (const record of res.mutations.updated) {
        updateRecord(record);
        cards.push(dtoToCard(record, 'updated'));
      }

      for (const deletedId of res.mutations.deletedIds) {
        const gone = before.find((r) => r.id === deletedId);
        if (gone) cards.push(removedCard(gone));
        removeRecord(deletedId);
      }

      patch(recordedAt, id, {
        status: 'done',
        reply: res.reply,
        suggestions: res.suggestions,
        cards,
      });
    } catch (err) {
      patch(recordedAt, id, {
        status: 'error',
        error: err instanceof ApiError ? err.message : '기록에 실패했어요',
        quota: err instanceof ApiError && err.status === 403, // 게스트 AI 상환
      });
    } finally {
      setSending(false);
    }
  }

  const last = messages[messages.length - 1];

  return {
    messages,
    sending,
    send,
    clear: () => clearDate(recordedAt),
    isFresh: (id: string) => freshIds.current.has(id),
    suggestions: !sending && last?.status === 'done' ? (last.suggestions ?? []) : [],
    gated: messages.some((m) => m.quota),
  };
}
