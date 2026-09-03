"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error", error);
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
