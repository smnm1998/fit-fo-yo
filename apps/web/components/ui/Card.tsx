import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

const STYLES = {
  card: 'rounded-lg border border-border bg-surface p-5',
} as const;

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(STYLES.card, className)} {...props} />;
}
