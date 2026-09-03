"use client";

import { createContext, useCallback, useContext, useId, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Modal } from "./modal";
import { Button } from "./button";

type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * `await confirm({ title, body, tone: "danger" })` — a delete button is one
 * line, not a hand-rolled dialog. Only one confirm can be open at a time,
 * which matches how destructive actions actually happen.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const titleId = useId();

  const confirm = useCallback<ConfirmContextValue>((options) => {
    return new Promise((resolve) => setPending({ options, resolve }));
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={pending !== null} onClose={() => settle(false)} maxWidth="420px" labelledBy={titleId}>
        {pending && (
          <div className="p-6">
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${
                pending.options.tone === "danger" ? "bg-bad-weak text-bad" : "bg-accent-weak text-accent-ink"
              }`}
            >
              <FiAlertTriangle size={18} />
            </div>
            <h2 id={titleId} className="mb-1.5 text-[16px] font-semibold text-ink">
              {pending.options.title}
            </h2>
            <p className="mb-6 text-[13.5px] leading-relaxed text-ink-2">{pending.options.body}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => settle(false)}>
                {pending.options.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={pending.options.tone === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={() => settle(true)}
                autoFocus
              >
                {pending.options.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
