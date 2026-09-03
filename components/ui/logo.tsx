/**
 * Icon + wordmark. `onInk` places the mark on an --ink-colored surface
 * (e.g. the auth panel) instead of the page background — the invert
 * direction flips since ink/paper swap meaning between light and dark.
 */
export function Logo({
  size = 20,
  onInk = false,
  className = "",
}: {
  size?: number;
  onInk?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static local asset, no next/image sizing needed */}
      <img
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className={onInk ? "logo-mark logo-mark-on-ink" : "logo-mark"}
      />
      <span className="text-[15px] font-bold tracking-[-0.02em]">Bloggy</span>
    </span>
  );
}
