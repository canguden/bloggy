"use client";

import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";

/** Page-level error boundary content — icon, plain sentence, two ways out. No stack traces. */
export function ErrorState({
  onRetry,
  title = "Something went wrong",
  description = "This page ran into a problem. Your data is safe — try again.",
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bad-weak text-bad">
        <FiAlertTriangle size={18} />
      </div>
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <p className="text-[13.5px] leading-relaxed text-ink-2">{description}</p>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
        <a href="/app">
          <Button variant="ghost" size="sm">
            Go to dashboard
          </Button>
        </a>
      </div>
    </div>
  );
}
