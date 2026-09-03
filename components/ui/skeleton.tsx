export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[var(--radius-sm)] ${className}`} />;
}
