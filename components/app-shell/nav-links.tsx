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

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  if (compact) {
    return (
      <ul className="flex items-stretch justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/app" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[var(--text-xs)] ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-sm)] font-medium transition-colors ${
                active
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
