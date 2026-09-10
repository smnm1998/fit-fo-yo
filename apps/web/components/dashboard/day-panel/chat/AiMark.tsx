export const AI_TONE = 'text-emerald-500 dark:text-emerald-400';
export const AI_GLOW = 'drop-shadow-[0_1px_5px_rgba(16,185,129,0.30)]';

export function AiMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2 L15.5 8.5 L22 12 L15.5 15.5 L12 22 L8.5 15.5 L2 12 L8.5 8.5 Z" />
    </svg>
  );
}
