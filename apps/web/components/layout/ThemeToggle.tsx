'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const BASE = 'p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground';

export function ThemeToggle({ className = 'rounded-lg' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`${BASE} ${className}`}
      aria-label={isDark ? '라이트 모드 전환' : '다크 모드 전환'}
    >
      {mounted && isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
