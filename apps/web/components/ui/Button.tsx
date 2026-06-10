import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

const button = cva(
  'inline-flex h-10 items-center justify-center rounded-lg px-4 text-base font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-surface hover:opacity-90',
        ghost: 'bg-transparent text-foreground hover:bg-subtle',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export function Button({ variant, fullWidth, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, fullWidth }), className)} {...props} />;
}
