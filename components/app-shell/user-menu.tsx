"use client";

import { useRouter } from "next/navigation";
import { FiLogOut, FiChevronDown } from "react-icons/fi";
import { signOut } from "@/lib/auth/auth-client";

export function UserMenu({
  name,
  email,
  compact = false,
}: {
  name: string;
  email: string;
  compact?: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--surface-sunken)] ${
          compact ? "" : "w-full"
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--text-sm)] font-medium text-[var(--accent)]">
          {initial}
        </span>
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[var(--text-sm)] font-medium text-[var(--text-primary)]">
              {name}
            </span>
            <span className="block truncate text-[var(--text-xs)] text-[var(--text-muted)]">{email}</span>
          </span>
        )}
        {!compact && <FiChevronDown size={14} className="shrink-0 text-[var(--text-muted)]" />}
      </summary>
      <div className="absolute bottom-full right-0 z-10 mb-1 w-44 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-1 shadow-[var(--shadow-md)]">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[var(--text-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
        >
          <FiLogOut size={14} />
          Sign out
        </button>
      </div>
    </details>
  );
}
