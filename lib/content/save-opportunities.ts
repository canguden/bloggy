import "server-only";
import { db } from "@/lib/db/client";
import { opportunities } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import type { ScoreResult } from "./opportunity-score";
import type { OpportunityEnrichment } from "@/lib/ai/schemas/opportunity-enrichment";

export async function saveOpportunities(
  websiteId: string,
  keywordIdsByText: Map<string, string>,
  scored: Array<{ keyword: string; score: ScoreResult; relatedKeywords: string[] }>,
  enrichment: OpportunityEnrichment[],
): Promise<number> {
  const enrichmentByKeyword = new Map(enrichment.map((e) => [e.keyword, e]));
  let created = 0;

  for (const candidate of scored) {
    const enriched = enrichmentByKeyword.get(candidate.keyword);
    if (!enriched) continue;

    await db.insert(opportunities).values({
      id: createId("opp"),
      websiteId,
      title: enriched.title,
      targetKeywordId: keywordIdsByText.get(candidate.keyword) ?? null,
      relatedKeywords: candidate.relatedKeywords,
      format: enriched.format,
      score: candidate.score.score,
      scoreBreakdown: candidate.score.breakdown,
      rationale: enriched.rationale,
      status: "new",
    });
    created++;
  }

  return created;
}
