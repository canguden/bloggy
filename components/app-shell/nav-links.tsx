"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiTarget, FiFileText, FiActivity, FiSettings } from "react-icons/fi";

const items = [
  { href: "/app", label: "Dashboard", icon: FiHome },
  { href: "/app/opportunities", label: "Opportunities", icon: FiTarget },
  { href: "/app/articles", label: "Articles", icon: FiFileText },
  { href: "/app/activity", label: "Activity", icon: FiActivity },
  { href: "/app/settings", label: "Settings", icon: FiSettings },
];

/** 5 items, never more — see the design plan's navigation principle. */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href} className="relative">
            {active && <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-ink" />}
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] py-2 pl-4 pr-3 text-[13.5px] font-medium transition-colors duration-[var(--dur-color)] ${
                active ? "text-ink" : "text-ink-2 hover:bg-paper-sunken hover:text-ink"
              }`}
            >
              <Icon size={16} className={active ? "text-ink" : "text-ink-3"} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
