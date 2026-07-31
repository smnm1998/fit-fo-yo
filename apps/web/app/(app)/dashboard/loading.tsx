const S = {
  wrap: 'flex flex-col gap-6',
  head: 'h-7 w-40 animate-pulse rounded-lg bg-subtle',
  toolbar: 'h-9 w-44 animate-pulse rounded-full bg-subtle',
  grid: 'grid gap-6 lg:grid-cols-[1fr_20rem]',
  calendar: 'h-[26rem] animate-pulse rounded-2xl bg-subtle',
  panel: 'h-[22rem] animate-pulse rounded-2xl bg-subtle',
} as const;

export default function DashboardLoading() {
  return (
    <div className={S.wrap}>
      <div className={S.head} />
      <div className="flex flex-col gap-4">
        <div className={S.toolbar} />
        <div className={S.grid}>
          <div className={S.calendar} />
          <div className={S.panel} />
        </div>
      </div>
    </div>
  );
}
