export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-line-2 px-6 py-20 text-center">
      {icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-paper-inset text-ink-3">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      <p className="max-w-sm text-[13.5px] text-ink-2">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
