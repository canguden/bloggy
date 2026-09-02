export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] ${className}`}
    >
      {children}
    </div>
  );
}
