import { useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { cn } from '@/lib/cn';

/** textarea 최대 높이 */
const MAX_HEIGHT = 128;

const STYLES = {
  dock: 'absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-4 pb-4 pt-10',

  suggestWrap: 'flex flex-col items-end gap-1.5',
  suggestToggle:
    'inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted shadow-[0_2px_8px_-5px_rgba(0,0,0,0.18)] transition-colors hover:bg-subtle hover:text-foreground',
  suggestGrid: 'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
  suggestList: 'flex min-h-0 flex-col items-end gap-1.5 overflow-hidden',
  suggestItem:
    'w-full cursor-pointer rounded-[16px_16px_5px_16px] border border-dashed border-border bg-transparent px-3.5 py-2 text-left text-xs text-muted transition-colors hover:border-solid hover:border-accent hover:bg-surface hover:text-foreground disabled:opacity-50 animate-[chipRise_400ms_ease-out_both]',

  input:
    'flex items-end gap-2 rounded-[22px] border border-border bg-surface p-1.5 pl-4 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.25)] transition-colors focus-within:border-accent',
  textarea:
    'max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted',
  send: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-surface transition-opacity hover:opacity-90 disabled:opacity-40',
} as const;

type Props = {
  suggestions: string[];
  sending: boolean;
  onSend: (text: string) => void;
};

export function ChatComposer({ suggestions, sending, onSend }: Props) {
  const [value, setValue] = useState('');
  const [showSuggest, setShowSuggest] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}`;
  }

  function submit(text: string) {
    if (!text.trim() || sending) return;
    onSend(text);
    setValue('');
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  /**
   * 한글 Enter로 조합을 확정
   * isComposing을 보지 않으면 조합 확정용 Enter가 전송으로 새어 "비빔바"처럼 잘린 채 전송된다.
   */
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(value);
    }
  }

  return (
    <div
      className={STYLES.dock}
      style={{ background: 'linear-gradient(to top, var(--background) 56%, transparent)' }}
    >
      {suggestions.length > 0 && (
        <div className={STYLES.suggestWrap}>
          <button
            type="button"
            className={STYLES.suggestToggle}
            onClick={() => setShowSuggest((v) => !v)}
            aria-expanded={showSuggest}
          >
            추천 {showSuggest ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>

          <div
            className={cn(
              STYLES.suggestGrid,
              showSuggest ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className={STYLES.suggestList}>
              {suggestions.map((s, i) => (
                <button
                  key={`${i}-${s}`}
                  type="button"
                  className={STYLES.suggestItem}
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => submit(s)}
                  disabled={sending}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={STYLES.input}>
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
          onClick={() => submit(value)}
          disabled={sending || value.trim().length === 0}
          className={STYLES.send}
          aria-label="전송"
        >
          <Send size={16} strokeWidth={2.1} />
        </button>
      </div>
    </div>
  );
}
