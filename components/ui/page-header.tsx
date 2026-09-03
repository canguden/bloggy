/** One h1 + one subtitle + one optional primary action — the only orientation a page needs. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-lg text-[13.5px] text-ink-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
