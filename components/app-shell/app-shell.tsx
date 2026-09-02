import Link from "next/link";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function AppShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-raised)] md:flex">
        <div className="px-5 py-5">
          <Link href="/app" className="font-serif text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">
            Bloggy
          </Link>
        </div>
        <nav className="flex-1 px-3">
          <NavLinks />
        </nav>
        <div className="border-t border-[var(--border-subtle)] p-3">
          <UserMenu name={userName} email={userEmail} />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 md:hidden">
          <Link href="/app" className="font-serif text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">
            Bloggy
          </Link>
          <UserMenu name={userName} email={userEmail} compact />
        </header>

        <main className="flex-1 bg-[var(--surface-page)] pb-16 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] md:hidden">
          <NavLinks compact />
        </nav>
      </div>
    </div>
  );
}
