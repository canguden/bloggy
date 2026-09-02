type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-subtle)] text-[var(--success)]",
  warning: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  danger: "bg-[var(--danger-subtle)] text-[var(--danger)]",
  accent: "bg-[var(--accent-subtle)] text-[var(--accent)]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[var(--text-xs)] font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
