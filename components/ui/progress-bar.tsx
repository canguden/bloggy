/** 2px hairline progress — used for score breakdown bars and usage meters. Never a donut/gauge. */
export function ProgressBar({ value, tone = "ink" }: { value: number; tone?: "ink" | "accent" }) {
  return (
    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-paper-inset">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-[var(--ease)] ${
          tone === "accent" ? "bg-accent" : "bg-ink"
        }`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
