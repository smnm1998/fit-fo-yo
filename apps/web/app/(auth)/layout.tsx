const STYLES = {
  main: 'flex min-h-screen items-center justify-center px-4',
  inner: 'w-full max-w-sm',
} as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={STYLES.main}>
      <div className={STYLES.inner}>{children}</div>
    </main>
  );
}
