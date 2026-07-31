const S = {
  wrap: 'flex flex-col gap-6',
  metric: 'h-24 animate-pulse rounded-lg bg-subtle',
  chart: 'h-[300px] animate-pulse rounded-lg bg-subtle',
} as const;

export default function StatsLoading() {
  return (
    <div className={S.wrap}>
      <div className={S.metric} />
      <div className={S.chart} />
      <div className={S.chart} />
    </div>
  );
}
