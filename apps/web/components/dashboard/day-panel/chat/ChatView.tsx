'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { logout } from '@/lib/client/auth-api';
import { useChatStore } from '@/lib/store/chat-store';
import { AiMark, AI_GLOW, AI_TONE } from './AiMark';
import { ChatComposer } from './ChatComposer';
import { ChatMessage } from './ChatMessage';
import { useChat } from './useChat';

const STYLES = {
  panel:
    'relative flex h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background animate-[viewInRight_220ms_ease-out]',
  head: 'flex items-center gap-2 px-3.5 py-3',
  back: 'grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-subtle',
  clear:
    'rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground',
  headRight: 'ml-auto flex items-center gap-1',
  headDate: 'text-[13px] font-semibold text-muted',

  scroller: 'relative flex min-h-0 flex-1 flex-col',
  body: 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-32 pt-1',

  hint: 'm-auto flex max-w-[15rem] flex-col items-center gap-3 text-center',
  hintTitle: 'mt-1 text-sm font-bold text-foreground',
  hintText: 'text-xs leading-relaxed text-muted',

  gate: 'absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 bg-background/55 px-6 text-center backdrop-blur-md',
  gateTitle: 'mt-1 text-base font-bold text-foreground',
  gateText: 'text-sm text-muted',
  gateBtn:
    'mt-3 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90',
} as const;

type Props = { recordedAt: string; onBack: () => void; dateLabelText?: string };

export function ChatView({ recordedAt, onBack, dateLabelText }: Props) {
  const { messages, sending, send, clear, isFresh, suggestions, gated } = useChat(recordedAt);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className={STYLES.panel}>
      <div className={STYLES.head}>
        <button type="button" onClick={onBack} className={STYLES.back} aria-label="뒤로">
          <ArrowLeft size={17} strokeWidth={2.1} />
        </button>
        <div className={STYLES.headRight}>
          {messages.length > 0 && (
            <button type="button" className={STYLES.clear} onClick={clear}>
              기록 지우기
            </button>
          )}
          {dateLabelText && <span className={STYLES.headDate}>{dateLabelText}</span>}
        </div>
      </div>

      <div className={STYLES.scroller}>
        <div className={STYLES.body}>
          {messages.length === 0 ? (
            <div className={STYLES.hint}>
              <AiMark size={38} className={cn(AI_TONE, AI_GLOW)} />
              <p className={STYLES.hintTitle}>무엇을 드셨나요?</p>
              <p className={STYLES.hintText}>
                먹은 것·운동을 말하듯 적으면 기록돼요.
                <br />
                수정·삭제도 말로 하면 됩니다.
              </p>
            </div>
          ) : (
            messages.map((m) => <ChatMessage key={m.id} msg={m} animate={isFresh(m.id)} />)
          )}
          <div ref={endRef} />
        </div>
      </div>

      <ChatComposer
        suggestions={suggestions}
        sending={sending}
        onSend={(text) => void send(text)}
      />

      {gated && <GuestGate />}
    </div>
  );
}

/** 게스트 AI 상한 도달 오버레이 — 세션을 정리하고 가입으로 보냄 */
function GuestGate() {
  async function goSignup() {
    try {
      await logout(); // 게스트 세션 정리 (토큰 충돌 방지)
    } catch {
      // API 다운 등은 무시하고 진행
    }
    useChatStore.getState().reset();
    window.location.href = '/signup'; // 하드 네비게이션 (확실히 이동)
  }

  return (
    <div className={STYLES.gate}>
      <AiMark size={44} className={cn(AI_TONE, AI_GLOW)} />
      <p className={STYLES.gateTitle}>게스트 체험이 끝났어요</p>
      <p className={STYLES.gateText}>회원가입하면 이어서 기록할 수 있어요.</p>
      <button type="button" onClick={() => void goSignup()} className={STYLES.gateBtn}>
        회원가입 하러 가기
      </button>
    </div>
  );
}
