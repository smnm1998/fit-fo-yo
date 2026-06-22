import { useEffect, useState } from 'react';

/**
 * active(로딩)가 delay(ms) 이상 지속될 때만 true.
 * 1.5초 안에 끝나는 로딩맨 스켈레톤을 안 띄워 깜빡임(flicker) 방지. (UX 롤)
 */
export function useDelayedFlag(active: boolean, delay = 1500): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }

    const id = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(id);
  }, [active, delay]);

  return shown;
}
