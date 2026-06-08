const STYLES = {
  container: 'flex min-h-screen flex-col items-center justify-center gap-4',
  title: 'text-3xl font-bold text-foreground',
  subtitle: 'text-muted',
} as const;

export default function Home() {
  return (
    <main className={STYLES.container}>
      <h1 className={STYLES.title}>FitFoYo</h1>
      <p className={STYLES.subtitle}>셋업 완료</p>
    </main>
  );
}
