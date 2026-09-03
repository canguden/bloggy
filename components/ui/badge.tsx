export type Tone = "neutral" | "ok" | "warn" | "bad" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-paper-inset text-ink-2",
  ok: "bg-ok-weak text-ok",
  warn: "bg-warn-weak text-warn",
  bad: "bg-bad-weak text-bad",
  accent: "bg-accent-weak text-accent-ink",
};

/** Status = icon + word, never color alone. Pass `icon` for that; tone sets the tint. */
export function Badge({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
