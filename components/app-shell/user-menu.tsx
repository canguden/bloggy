"use client";

import { useRouter } from "next/navigation";
import { FiChevronDown, FiSettings } from "react-icons/fi";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu
      side="top"
      align={compact ? "end" : "start"}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={`flex items-center gap-2 rounded-[var(--radius-sm)] hover:bg-paper-sunken ${
            compact ? "h-8 w-8 justify-center rounded-full" : "w-full px-2.5 py-2 text-left"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-ink-inv">
            {initial}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
                <span className="block truncate text-[11.5px] text-ink-3">Free plan</span>
              </span>
              <FiChevronDown size={13} className="shrink-0 text-ink-3" />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
            <p className="truncate text-[12px] text-ink-3">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <DropdownItem
            icon={<FiSettings size={14} />}
            onClick={() => {
              close();
              router.push("/app/settings");
            }}
          >
            Settings
          </DropdownItem>
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="text-[13px] text-ink-2">Theme</span>
            <ThemeToggle />
          </div>
        </>
      )}
    </DropdownMenu>
  );
}
