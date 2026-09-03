"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiPlus, FiGlobe } from "react-icons/fi";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { SiteChip } from "@/components/ui/site-chip";
import type { websites as websitesTable } from "@/lib/db/schema";

type Website = typeof websitesTable.$inferSelect;

/** Quick jump between websites — Bloggy supports one org, many sites. */
export function SiteSwitcher({ websites }: { websites: Website[] }) {
  const router = useRouter();

  if (websites.length === 0) {
    return (
      <Link
        href="/app/websites"
        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-line-2 px-3 py-2 text-[13px] text-ink-3 hover:border-line-3 hover:text-ink-2"
      >
        <FiGlobe size={14} />
        Add a website
      </Link>
    );
  }

  return (
    <DropdownMenu
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 hover:bg-paper-sunken"
        >
          <SiteChip domain={websites[0].domain} faviconUrl={websites[0].faviconUrl} size="sm" />
          <FiChevronDown size={13} className="shrink-0 text-ink-3" />
        </button>
      )}
    >
      {(close) => (
        <>
          {websites.map((site) => (
            <Link
              key={site.id}
              href={`/app/websites/${site.id}`}
              onClick={close}
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] text-ink-2 hover:bg-paper-sunken hover:text-ink"
            >
              <SiteChip domain={site.domain} faviconUrl={site.faviconUrl} size="sm" />
            </Link>
          ))}
          <div className="my-1 h-px bg-line" />
          <DropdownItem
            icon={<FiPlus size={14} />}
            onClick={() => {
              close();
              router.push("/app/websites");
            }}
          >
            Add website
          </DropdownItem>
        </>
      )}
    </DropdownMenu>
  );
}
