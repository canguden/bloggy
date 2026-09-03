"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
};

type ShowOptions = {
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  show: (message: string, options?: ShowOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 3;

const VARIANT_ICON: Record<ToastVariant, React.ComponentType<{ size?: number; className?: string }>> = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};
const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: "text-ok",
  error: "text-bad",
  info: "text-ink-3",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const schedule = useCallback(
    (id: string) => {
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
      );
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, options?: ShowOptions) => {
      setToasts((current) => {
        // Dedupe: an identical message already showing just resets its timer.
        if (current.some((t) => t.message === message)) return current;
        const id = `toast-${++counter.current}`;
        const next = [...current, { id, message, variant: options?.variant ?? "info", action: options?.action }];
        schedule(id);
        return next.slice(-MAX_TOASTS);
      });
    },
    [schedule],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = VARIANT_ICON[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              onMouseEnter={() => clearTimeout(timers.current.get(toast.id))}
              onMouseLeave={() => schedule(toast.id)}
              className="flex min-w-[300px] max-w-sm items-start gap-3 rounded-[var(--radius-md)] border border-line bg-paper-overlay px-4 py-3.5 shadow-md"
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${VARIANT_COLOR[toast.variant]}`} aria-hidden />
              <p className="flex-1 text-[13.5px] leading-snug text-ink">{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="shrink-0 text-[13px] font-medium text-accent hover:underline"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-ink-3 hover:text-ink"
              >
                <FiX size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
