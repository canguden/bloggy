"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in /app", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <h2 className="text-[var(--text-lg)] font-medium text-[var(--text-primary)]">Something went wrong</h2>
      <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
        This page ran into a problem. Your data is safe — try again.
      </p>
      <Button variant="secondary" onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
