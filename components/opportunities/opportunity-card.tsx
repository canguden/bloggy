"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiKey, FiX } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteChip } from "@/components/ui/site-chip";
import { useToast } from "@/components/ui/toast";
import { ScoreBreakdown, scoreTone } from "./score-breakdown";
import { dismissOpportunityAction, restoreOpportunityAction } from "@/lib/content/opportunity-actions";
import { generateArticleAction } from "@/lib/content/article-actions";
import { formatVolume } from "@/lib/format";
import type { opportunities as opportunitiesTable } from "@/lib/db/schema";

type Opportunity = typeof opportunitiesTable.$inferSelect;

const FORMAT_LABEL: Record<string, string> = {
  how_to: "How-to",
  listicle: "List",
  comparison: "Comparison",
  guide: "Guide",
  landing: "Landing page",
};

const TONE_CLASS = { bad: "text-bad", warn: "text-warn", ok: "text-ok" } as const;

export function OpportunityCard({
  opportunity,
  domain,
  faviconUrl,
  keyword,
  volume,
  onDismissed,
}: {
  opportunity: Opportunity;
  domain: string;
  faviconUrl?: string | null;
  keyword?: string | null;
  volume?: number | null;
  onDismissed?: (id: string) => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, setPending] = useState<"dismiss" | "generate" | null>(null);

  async function handleDismiss() {
    setPending("dismiss");
    const result = await dismissOpportunityAction(opportunity.id);
    setPending(null);
    if (result.success) {
      onDismissed?.(opportunity.id);
      show("Opportunity dismissed", {
        variant: "info",
        action: {
          label: "Undo",
          onClick: async () => {
            const restored = await restoreOpportunityAction(opportunity.id);
            if (restored.success) router.refresh();
          },
        },
      });
      router.refresh();
    } else {
      show(result.error ?? "Couldn't dismiss this opportunity", { variant: "error" });
    }
  }

  async function handleGenerate() {
    setPending("generate");
    const result = await generateArticleAction(opportunity.id);
    setPending(null);
    if (result.success) {
      show("Writing your article…", { variant: "success" });
      router.push(`/app/articles/${result.articleId}`);
    } else {
      show(result.error ?? "Couldn't start writing this article", { variant: "error" });
    }
  }

  const breakdown = opportunity.scoreBreakdown as {
    searchDemand: number;
    competition: number;
    businessRelevance: number;
    commercialIntent: number;
    contentGap: number;
  };
  const tone = scoreTone(opportunity.score);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <SiteChip domain={domain} faviconUrl={faviconUrl} size="sm" />
            <Badge tone="neutral">{FORMAT_LABEL[opportunity.format] ?? opportunity.format}</Badge>
          </div>
          <h3 className="text-[16px] font-semibold leading-snug text-ink">{opportunity.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-[var(--radius-sm)] border border-line px-3.5 py-2">
          <span className={`mono text-[28px] font-bold leading-none ${TONE_CLASS[tone]}`}>{opportunity.score}</span>
          <span className="eyebrow mt-0.5 text-ink-3">Score</span>
        </div>
      </div>

      {opportunity.rationale && (
        <p className="mb-4 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{opportunity.rationale}</p>
      )}

      <div className="mb-4">
        <ScoreBreakdown breakdown={breakdown} />
      </div>

      {keyword && (
        <p className="mono mb-4 flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <FiKey size={12} />
          {keyword}
          {typeof volume === "number" && <span>· {formatVolume(volume)}/mo</span>}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
        <Button size="sm" loading={pending === "generate"} onClick={handleGenerate}>
          Write this article
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={pending === "dismiss"}
          iconLeft={<FiX size={13} />}
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
