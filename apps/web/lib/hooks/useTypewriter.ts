import { useEffect, useRef, useState } from 'react';

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useTypewriter(text: string, enabled: boolean, charsPerSec = 45) {
  const [count, setCount] = useState(() => (enabled && !REDUCED ? 0 : text.length));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || REDUCED) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const elapsed = (t - start) / 1000;
      const next = Math.min(text.length, Math.floor(elapsed * charsPerSec));
      setCount(next);
      if (next < text.length) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [text, enabled, charsPerSec]);

  return text.slice(0, count);
}
