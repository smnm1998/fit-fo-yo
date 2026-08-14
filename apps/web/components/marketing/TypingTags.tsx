'use client';

import { useEffect, useState } from 'react';

// 테두리 없이 해시태그 글자 자체를 크게. 태그마다 색 다르게, 랜덤 순환 타이핑.
const TAGS = [
  { text: 'AI가대신기록', color: 'text-emerald-500' },
  { text: '한줄이면끝', color: 'text-sky-500' },
  { text: '칼로리자동계산', color: 'text-amber-500' },
  { text: '식단운동한눈에', color: 'text-violet-500' },
  { text: '매일맞춤추천', color: 'text-rose-500' },
];

export function TypingTags() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = TAGS[idx]?.text ?? '';
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === full) {
      t = setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && text === '') {
      setDeleting(false);
      setIdx((p) => {
        let n = p;
        while (n === p) n = Math.floor(Math.random() * TAGS.length);
        return n;
      });
    } else {
      t = setTimeout(
        () =>
          setText((prev) =>
            deleting ? full.slice(0, prev.length - 1) : full.slice(0, prev.length + 1),
          ),
        deleting ? 45 : 90,
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, idx]);

  const color = TAGS[idx]?.color ?? 'text-foreground';

  return (
    <div
      className={`flex items-center justify-center gap-1 text-2xl font-bold tracking-tight sm:text-3xl ${color}`}
    >
      <span aria-hidden>#</span>
      <span>{text}</span>
      <span
        aria-hidden
        className="ml-0.5 inline-block h-6 w-0.5 bg-current sm:h-7"
        style={{ animation: 'blink 1s step-end infinite' }}
      />
    </div>
  );
}
