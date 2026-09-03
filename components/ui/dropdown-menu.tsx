"use client";

import { useEffect, useRef, useState } from "react";

type DropdownMenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
};

/** Click-outside + Escape to close, keyboard-focusable items, positioned relative to its trigger. */
export function DropdownMenu({ trigger, children, align = "start", side = "bottom" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-1.5 min-w-[180px] rounded-[var(--radius-md)] border border-line bg-paper-overlay p-1 shadow-md ${
            align === "end" ? "right-0" : "left-0"
          } ${side === "top" ? "bottom-full mb-1.5 mt-0" : ""}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  icon,
  danger,
  children,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[13.5px] transition-colors duration-[var(--dur-color)] ${
        danger ? "text-bad hover:bg-bad-weak" : "text-ink-2 hover:bg-paper-sunken hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
