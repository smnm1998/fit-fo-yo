'use client';

import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STYLE = 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground';

/** 다크모드 토글 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={STYLE}
      aria-label={dark ? '라이트 모드 전환' : '다크 모드 전환'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
