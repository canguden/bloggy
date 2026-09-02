export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] ${className}`}
    />
  );
}
