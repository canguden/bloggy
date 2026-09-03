"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { startResearchAction } from "@/lib/content/opportunity-actions";

export function StartResearchButton({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await startResearchAction(websiteId);
    setPending(false);
    if (result.success) {
      show("Researching search opportunities…", { variant: "success" });
      router.refresh();
    } else {
      show(result.error ?? "Couldn't start research", { variant: "error" });
    }
  }

  return (
    <Button loading={pending} onClick={handleClick}>
      Find opportunities
    </Button>
  );
}
