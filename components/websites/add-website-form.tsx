"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addWebsiteAction, type AddWebsiteResult } from "@/lib/websites/website-actions";

const initialState: AddWebsiteResult = { success: false, error: "" };

export function AddWebsiteForm() {
  const router = useRouter();
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(addWebsiteAction, initialState);

  useEffect(() => {
    if (state.success) {
      show("Website added. Bloggy is analyzing it now.", "success");
      router.push(`/app/websites/${state.websiteId}`);
    }
  }, [state, router, show]);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="Website URL" error={!state.success && state.error ? state.error : undefined}>
          {(inputProps) => (
            <Input {...inputProps} name="url" type="text" placeholder="example.com" required />
          )}
        </Field>
      </div>
      <Button type="submit" loading={pending}>
        Analyze website
      </Button>
    </form>
  );
}
