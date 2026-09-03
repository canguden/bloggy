"use client";

import { useId } from "react";
import { FiX } from "react-icons/fi";
import { Modal } from "./modal";

/** Narrow, 1-2 fields, consistent header/close/footer chrome for every create/edit dialog. */
export function FormDialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "420px",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} maxWidth={maxWidth} labelledBy={titleId}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-[15px] font-semibold text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 hover:bg-paper-sunken hover:text-ink"
        >
          <FiX size={15} />
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>
    </Modal>
  );
}
