"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Shell around a native <dialog>: mount/unmount, `showModal`/`close`, backdrop
 * click to dismiss, and the CSS entrance/backdrop transitions in globals.css
 * (`dialog.modal`). Focus trap, Escape-to-close, and top-layer stacking all
 * come from the browser for free — this file only adds the React lifecycle.
 */
export function Modal({
  open,
  onClose,
  children,
  maxWidth = "480px",
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={ref}
      className="modal w-[calc(100%-2rem)] p-0"
      style={{ maxWidth }}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && children}
    </dialog>,
    document.body,
  );
}
