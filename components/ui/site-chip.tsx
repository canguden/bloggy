"use client";

import { useState } from "react";
import { FiGlobe } from "react-icons/fi";

type Size = "sm" | "md";

const sizeClasses: Record<Size, { box: string; icon: number; text: string }> = {
  sm: { box: "h-5 w-5", icon: 11, text: "text-[13px]" },
  md: { box: "h-7 w-7", icon: 14, text: "text-[14.5px]" },
};

/**
 * Favicon + domain — the "this product knows me" cue, used everywhere a
 * website is referenced. Falls back to a plain globe glyph in a tinted
 * square if there's no favicon yet or it fails to load; never breaks layout.
 */
export function SiteChip({
  domain,
  faviconUrl,
  size = "md",
  mono = true,
}: {
  domain: string;
  faviconUrl?: string | null;
  size?: Size;
  mono?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const { box, icon, text } = sizeClasses[size];
  const showFavicon = faviconUrl && !failed;

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-paper-inset ${box}`}>
        {showFavicon ? (
          // Favicons are small, third-party, and variably shaped — a plain
          // <img> with a fallback is more robust here than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconUrl} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} />
        ) : (
          <FiGlobe size={icon} className="text-ink-3" aria-hidden />
        )}
      </span>
      <span className={`truncate text-ink-2 ${mono ? "mono" : ""} ${text}`}>{domain}</span>
    </span>
  );
}
