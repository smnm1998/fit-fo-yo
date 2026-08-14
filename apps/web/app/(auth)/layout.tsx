import { ThemeToggle } from '@/components/layout/ThemeToggle';

const STYLES = {
  main: 'relative flex min-h-screen items-center justify-center px-4',
  inner: 'w-full max-w-sm',
} as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={STYLES.main}>
      <div className="absolute bottom-4 left-4">
        <ThemeToggle className="rounded-full border border-border bg-surface shadow-sm" />
      </div>

      <div className={STYLES.inner}>{children}</div>
    </main>
  );
}
