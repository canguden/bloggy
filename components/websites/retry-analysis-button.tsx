"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { retryAnalysisAction } from "@/lib/websites/website-actions";

export function RetryAnalysisButton({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, setPending] = useState(false);

  async function handleRetry() {
    setPending(true);
    const result = await retryAnalysisAction(websiteId);
    setPending(false);
    if (result.success) {
      router.refresh();
    } else {
      show(result.error ?? "Couldn't retry analysis", "error");
    }
  }

  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={handleRetry}>
      Try again
    </Button>
  );
}
