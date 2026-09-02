"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ScoreBreakdown } from "./score-breakdown";
import { dismissOpportunityAction } from "@/lib/content/opportunity-actions";
import { generateArticleAction } from "@/lib/content/article-actions";
import type { opportunities as opportunitiesTable } from "@/lib/db/schema";

type Opportunity = typeof opportunitiesTable.$inferSelect;

const FORMAT_LABEL: Record<string, string> = {
  how_to: "How-to",
  listicle: "List",
  comparison: "Comparison",
  guide: "Guide",
  landing: "Landing page",
};

export function OpportunityCard({ opportunity, domain }: { opportunity: Opportunity; domain: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, setPending] = useState<"dismiss" | "generate" | null>(null);

  async function handleDismiss() {
    setPending("dismiss");
    const result = await dismissOpportunityAction(opportunity.id);
    setPending(null);
    if (result.success) {
      show("Opportunity dismissed", "success");
      router.refresh();
    } else {
      show(result.error ?? "Couldn't dismiss this opportunity", "error");
    }
  }

  async function handleGenerate() {
    setPending("generate");
    const result = await generateArticleAction(opportunity.id);
    setPending(null);
    if (result.success) {
      show("Writing your article…", "success");
      router.push(`/app/articles/${result.articleId}`);
    } else {
      show(result.error ?? "Couldn't start writing this article", "error");
    }
  }

  const breakdown = opportunity.scoreBreakdown as {
    searchDemand: number;
    competition: number;
    businessRelevance: number;
    commercialIntent: number;
    contentGap: number;
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{domain}</p>
          <h3 className="text-[var(--text-lg)] font-medium text-[var(--text-primary)]">{opportunity.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-serif text-[var(--text-2xl)] font-semibold text-[var(--accent)]">
            {opportunity.score}
          </span>
          <Badge tone="neutral">{FORMAT_LABEL[opportunity.format] ?? opportunity.format}</Badge>
        </div>
      </div>

      {opportunity.rationale && (
        <p className="mb-4 text-[var(--text-sm)] text-[var(--text-secondary)]">{opportunity.rationale}</p>
      )}

      <div className="mb-4">
        <ScoreBreakdown breakdown={breakdown} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" loading={pending === "generate"} onClick={handleGenerate}>
          Generate article
        </Button>
        <Button size="sm" variant="ghost" loading={pending === "dismiss"} onClick={handleDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
