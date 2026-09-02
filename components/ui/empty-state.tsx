export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-6 py-16 text-center">
      <h3 className="text-[var(--text-lg)] font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="max-w-sm text-[var(--text-sm)] text-[var(--text-secondary)]">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
