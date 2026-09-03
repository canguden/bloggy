import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

/** "4  Opportunities to act on  ›" — the dashboard's list of what's waiting. Zero rows go muted. */
export function StatRow({ count, label, href }: { count: number; label: string; href: string }) {
  const isZero = count === 0;
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 border-b border-line py-3.5 transition-colors duration-[var(--dur-color)] first:pt-0 last:border-b-0 hover:bg-paper-sunken"
    >
      <span className="flex items-baseline gap-3">
        <span className={`mono text-[22px] font-semibold tabular-nums ${isZero ? "text-ink-3" : "text-ink"}`}>
          {count}
        </span>
        <span className={`text-[14px] ${isZero ? "text-ink-3" : "text-ink-2"}`}>{label}</span>
      </span>
      <FiChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}
