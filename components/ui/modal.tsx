"use client";

import { useEffect, useRef, useState } from "react";
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
  // The portal target only exists client-side. Rendering it straight off a
  // `typeof document` check would match on the client's first render too
  // (document already exists by then) but not on the server's HTML, which
  // is a hydration mismatch — so gate on a state flip that happens strictly
  // after mount instead.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag to unlock the portal, not a render loop
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!mounted) return null;

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
