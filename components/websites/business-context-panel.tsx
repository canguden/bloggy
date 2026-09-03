"use client";

import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { updateBusinessContextAction } from "@/lib/business-context/business-context-actions";
import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";

export function BusinessContextPanel({
  websiteId,
  details,
}: {
  websiteId: string;
  details: NonNullable<BusinessContextWithDetails>;
}) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { context, offerings, audiences } = details;

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await updateBusinessContextAction(formData);
    setSubmitting(false);
    if (result.success) {
      setFieldErrors({});
      show("Business context updated", { variant: "success" });
      setEditing(false);
    } else {
      setFieldErrors(result.fieldErrors ?? {});
      show(result.error ?? "Couldn't save your changes", { variant: "error" });
    }
  }

  if (editing) {
    return (
      <form action={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="websiteId" value={websiteId} />
        <Field label="What this business does" error={fieldErrors.summary}>
          {(inputProps) => (
            <Textarea {...inputProps} name="summary" defaultValue={context.summary} rows={3} required />
          )}
        </Field>
        <Field label="Brand voice" hint="A few words describing tone, e.g. 'direct, technical, no hype'.">
          {(inputProps) => (
            <Input {...inputProps} name="brandVoice" defaultValue={context.brandVoice ?? ""} />
          )}
        </Field>
        <Field label="Differentiators" hint="One per line.">
          {(inputProps) => (
            <Textarea
              {...inputProps}
              name="differentiators"
              defaultValue={context.differentiators.join("\n")}
              rows={4}
            />
          )}
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={submitting}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <h3 className="eyebrow text-ink-3">What Bloggy understood</h3>
            {context.source === "derived" ? (
              <Badge tone="neutral">From your website</Badge>
            ) : (
              <Badge tone="accent">Edited by you</Badge>
            )}
          </div>
          <p className="text-[14.5px] leading-relaxed text-ink">{context.summary}</p>
        </div>
        <Button variant="ghost" size="sm" iconLeft={<FiEdit2 size={13} />} onClick={() => setEditing(true)}>
          Fix anything
        </Button>
      </div>

      {context.brandVoice && (
        <div>
          <h4 className="eyebrow mb-1 text-ink-3">Brand voice</h4>
          <p className="text-[13.5px] text-ink-2">{context.brandVoice}</p>
        </div>
      )}

      {offerings.length > 0 && (
        <div>
          <h4 className="eyebrow mb-2 text-ink-3">Offerings</h4>
          <ul className="flex flex-col gap-1.5">
            {offerings.map((o) => (
              <li key={o.id} className="text-[13.5px] text-ink-2">
                <span className="font-medium text-ink">{o.name}</span>
                {o.description ? ` — ${o.description}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audiences.length > 0 && (
        <div>
          <h4 className="eyebrow mb-2 text-ink-3">Target audiences</h4>
          <div className="flex flex-wrap gap-1.5">
            {audiences.map((a) => (
              <Badge key={a.id} tone="neutral">
                {a.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
