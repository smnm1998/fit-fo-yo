import { cn } from '@/lib/cn';
import { cva } from 'class-variance-authority';
import { forwardRef, type InputHTMLAttributes } from 'react';

const input = cva(
  'h-10 w-full rounded-lg border bg-surface px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted',
  {
    variants: {
      invalid: {
        true: 'border-danger focus:border-danger',
        false: 'border-border focus:border-accent',
      },
    },
    defaultVariants: { invalid: false },
  },
);

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(input({ invalid: Boolean(error) }), className)}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});
