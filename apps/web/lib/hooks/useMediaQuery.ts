'use client';

import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리 일치여부
 * 서버 첫 렌더에서는 항상 false로 시작
 * 레이아웃이 아닌 동작 판단에만 사용할 것
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
