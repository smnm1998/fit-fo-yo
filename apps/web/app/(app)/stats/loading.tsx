const STYLES = {
  wrap: 'flex flex-col gap-6',
  metric: 'h-24 animate-pulse rounded-lg bg-subtle',
  chart: 'h-[300px] animate-pulse rounded-lg bg-subtle',
} as const;

export default function StatsLoading() {
  return (
    <div className={STYLES.wrap}>
      <div className={STYLES.metric} />
      <div className={STYLES.chart} />
      <div className={STYLES.chart} />
    </div>
  );
}
