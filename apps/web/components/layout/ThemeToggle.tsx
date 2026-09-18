'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/cn';

const BASE = 'flex items-center gap-3 text-muted transition-colors hover:text-foreground';

export function ThemeToggle({
  className = 'rounded-lg p-1.5 hover:bg-subtle',
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(BASE, className)}
      aria-label={isDark ? '라이트 모드 전환' : '다크 모드 전환'}
    >
      {mounted && isDark ? (
        <Sun size={18} className="shrink-0" />
      ) : (
        <Moon size={18} className="shrink-0" />
      )}
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
