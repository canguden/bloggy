"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { SiteSwitcher } from "./site-switcher";
import { Logo } from "@/components/ui/logo";
import type { websites as websitesTable } from "@/lib/db/schema";

type Website = typeof websitesTable.$inferSelect;

export function AppShell({
  children,
  userName,
  userEmail,
  websites,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  websites: Website[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-paper-raised md:flex">
        <div className="flex h-14 items-center px-5">
          <Link href="/app" className="text-ink">
            <Logo size={20} />
          </Link>
        </div>

        <div className="px-3 pb-2">
          <SiteSwitcher websites={websites} />
        </div>

        <nav className="flex-1 px-3 pt-2">
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </nav>

        <div className="border-t border-line p-3">
          <UserMenu name={userName} email={userEmail} />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-paper-raised px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunken"
          >
            <FiMenu size={18} />
          </button>
          <Link href="/app" className="text-ink">
            <Logo size={18} />
          </Link>
          <UserMenu name={userName} email={userEmail} compact />
        </header>

        <main className="flex-1 bg-paper">{children}</main>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper-raised shadow-md">
            <div className="flex h-14 items-center justify-between px-5">
              <span className="text-ink">
                <Logo size={18} />
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunken"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="px-3 pb-2">
              <SiteSwitcher websites={websites} />
            </div>
            <nav className="flex-1 px-3 pt-2">
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
