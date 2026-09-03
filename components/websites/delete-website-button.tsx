"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { deleteWebsiteAction } from "@/lib/websites/website-actions";

export function DeleteWebsiteButton({
  websiteId,
  domain,
  icon,
}: {
  websiteId: string;
  domain: string;
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const ok = await confirm({
      title: `Delete ${domain}?`,
      body: "This removes every page, opportunity, and article tied to this website. This can't be undone.",
      confirmLabel: "Delete website",
      tone: "danger",
    });
    if (!ok) return;

    setPending(true);
    const result = await deleteWebsiteAction(websiteId);
    setPending(false);

    if (result.success) {
      show("Website deleted", { variant: "success" });
      router.push("/app/websites");
    } else {
      show(result.error ?? "Couldn't delete website", { variant: "error" });
    }
  }

  return (
    <Button variant="danger" size="sm" loading={pending} iconLeft={icon} onClick={handleClick}>
      Delete website
    </Button>
  );
}
