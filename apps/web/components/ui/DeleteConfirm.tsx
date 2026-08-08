const STYLES = {
  overlay:
    'absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-[inherit] bg-surface/60 backdrop-blur-sm',
  msg: 'text-sm font-medium text-foreground',
  row: 'flex items-center gap-1.5',
  ghost:
    'rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-subtle disabled:opacity-50',
  danger:
    'rounded-lg bg-danger px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50',
} as const;

export function DeleteConfirm({
  message = '삭제할까요?',
  onCancel,
  onConfirm,
  busy = false,
}: {
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <div className={STYLES.overlay}>
      <span className={STYLES.msg}>{message}</span>
      <div className={STYLES.row}>
        <button type="button" className={STYLES.ghost} onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button type="button" className={STYLES.danger} onClick={onConfirm} disabled={busy}>
          삭제
        </button>
      </div>
    </div>
  );
}
