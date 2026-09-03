"use client";

import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Chip } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import { updateBusinessContextAction } from "@/lib/business-context/business-context-actions";
import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";

export function OnboardingReview({ websiteId, onDone }: { websiteId: string; onDone: () => void }) {
  const { show } = useToast();
  const [details, setDetails] = useState<BusinessContextWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/websites/${websiteId}/business-context`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { context: BusinessContextWithDetails }) => {
        if (cancelled) return;
        setDetails(data.context);
        setSummary(data.context?.context.summary ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.set("websiteId", websiteId);
    formData.set("summary", summary);
    const result = await updateBusinessContextAction(formData);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      show(result.error ?? "Couldn't save your changes", { variant: "error" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-[13.5px] text-ink-3">
        <CgSpinner className="animate-spin" size={16} />
        Pulling together what Bloggy learned…
      </div>
    );
  }

  if (!details) {
    return (
      <div>
        <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">Almost there</h1>
        <p className="mt-2 mb-6 text-[13.5px] text-ink-2">
          Bloggy is still working this out. You can head to your dashboard and check back shortly.
        </p>
        <Button size="lg" className="w-full" onClick={onDone}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  const { offerings, audiences } = details;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink">
            Here&apos;s what we understood.
          </h1>
          <p className="mt-2 max-w-sm text-[13.5px] text-ink-2">
            Fix anything that&apos;s off — everything Bloggy writes is built on this.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-[var(--radius-md)] border border-line p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="eyebrow text-ink-3">What you do</h3>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[12.5px] font-medium text-ink-3 hover:text-ink"
            >
              <FiEdit2 size={12} />
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-3">
            <Textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              aria-label="What this business does"
            />
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13.5px] leading-relaxed text-ink">{summary}</p>
        )}
      </div>

      {offerings.length > 0 && (
        <div className="mb-5">
          <h3 className="eyebrow mb-2 text-ink-3">Offerings</h3>
          <div className="flex flex-wrap gap-1.5">
            {offerings.map((o) => (
              <Chip key={o.id}>{o.name}</Chip>
            ))}
          </div>
        </div>
      )}

      {audiences.length > 0 && (
        <div className="mb-7">
          <h3 className="eyebrow mb-2 text-ink-3">Audiences</h3>
          <div className="flex flex-wrap gap-1.5">
            {audiences.map((a) => (
              <Chip key={a.id}>{a.name}</Chip>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" className="w-full" onClick={onDone}>
        Looks right
      </Button>
    </div>
  );
}
