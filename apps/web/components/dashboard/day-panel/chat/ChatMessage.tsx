import { Activity, Salad, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RECORD_TYPE_META } from '@/lib/record-meta';
import { useTypewriter } from '@/lib/hooks/useTypewriter';
import type { ChatCard, ChatMsg } from '@/lib/store/chat-store';
import { AiMark, AI_GLOW, AI_TONE } from './AiMark';

const STYLES = {
  turn: 'flex flex-col gap-2.5 animate-[slideUpIn_240ms_ease-out]',
  userMsg:
    'ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[16px_16px_5px_16px] bg-accent px-3.5 py-2 text-xs leading-relaxed text-surface',

  bot: 'flex max-w-[92%] items-start gap-2.5',
  botMark: cn('mt-0.5 shrink-0', AI_TONE, AI_GLOW),
  botContent: 'flex min-w-0 flex-col gap-2.5',
  botText: 'text-[13px] leading-relaxed text-foreground',
  botError: 'text-[13px] text-danger',

  gen: 'flex items-center gap-2.5 text-xs text-muted',
  genIcon: cn('grid place-items-center', AI_TONE, AI_GLOW),
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
} as const;

type Props = {
  msg: ChatMsg;
  animate: boolean; // 방금 받은 답변이면 타이핑 애니메이션
};

export function ChatMessage({ msg, animate }: Props) {
  return (
    <div className={STYLES.turn}>
      <div className={STYLES.userMsg}>{msg.text}</div>

      {msg.status === 'pending' && (
        <div className={STYLES.gen}>
          <span className={STYLES.genIcon}>
            <span className={STYLES.genInner}>
              <AiMark size={19} />
            </span>
          </span>
          <span>생성 중이에요...</span>
        </div>
      )}

      {msg.status === 'done' && (
        <div className={STYLES.bot}>
          <span className={STYLES.botMark}>
            <AiMark size={19} />
          </span>
          <div className={STYLES.botContent}>
            {msg.reply && <BotText text={msg.reply} animate={animate} />}
            {msg.cards?.map((card, i) => (
              <ChatRecordCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {msg.status === 'error' && (
        <div className={STYLES.bot}>
          <span className={STYLES.botMark}>
            <AiMark size={20} />
          </span>
          <p className={STYLES.botError}>{msg.error}</p>
        </div>
      )}
    </div>
  );
}

function ChatRecordCard({ card }: { card: ChatCard }) {
  const removed = card.kind === 'removed';
  const Icon = card.type === 'DIET' ? Salad : Activity;

  return (
    <div className={cn(STYLES.card, removed && STYLES.cardRemoved)}>
      <span
        className={cn(
          STYLES.cardIco,
          removed ? 'bg-subtle text-muted' : RECORD_TYPE_META[card.type].badgeSoft,
        )}
      >
        {removed ? <Trash2 size={16} /> : <Icon size={17} />}
      </span>

      <div className={STYLES.cardMain}>
        <div className={STYLES.cardTop}>
          <span className={removed ? STYLES.cardNameDel : STYLES.cardName}>{card.name}</span>
          {!removed && card.meal && <span className={STYLES.cardMeal}>{card.meal}</span>}
        </div>
        <div className={STYLES.cardSub}>
          <span className={removed ? undefined : 'font-semibold text-foreground'}>
            {card.detail}
          </span>
        </div>
      </div>
    </div>
  );
}

function BotText({ text, animate }: { text: string; animate: boolean }) {
  const shown = useTypewriter(text, animate);
  return <p className={STYLES.botText}>{shown}</p>;
}
