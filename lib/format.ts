/**
 * Every number the UI shows goes through one of these — consistent
 * formatting, and it's the one place to change it. Rendered with the
 * `.mono` class (tabular-nums) at the call site.
 */

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Search volume style: 27100 -> "27.1k", 900 -> "900". */
export function formatVolume(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)}`;
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

/** "2h ago", "3d ago", "just now" — never a raw ISO timestamp in the UI. */
export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((target.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 45) return "just now";

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (absSeconds >= unitSeconds) {
      const value = Math.round(seconds / unitSeconds);
      return relativeFormatter.format(value, unit);
    }
  }
  return "just now";
}

export function formatDate(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(target);
}

export function formatTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(target);
}

export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
