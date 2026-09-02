import "server-only";
import { generateObject } from "ai";
import { structuredModel } from "./model";
import { opportunityEnrichmentSchema, type OpportunityEnrichment } from "./schemas/opportunity-enrichment";
import { buildBusinessContextPrompt } from "./build-business-context-prompt";
import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";
import type { ScoreResult } from "@/lib/content/opportunity-score";
import { ProviderError } from "@/lib/errors";

const SYSTEM_PROMPT = `You write short, plain-language explanations of why a keyword is a good content
opportunity for a specific business. You are given each keyword's already-computed score breakdown —
never invent or imply a different score. Ground your rationale in the breakdown (e.g. "low competition
and strong relevance to your invoicing product"). Titles should be specific and non-generic.`;

export async function enrichOpportunities(
  businessContext: BusinessContextWithDetails,
  candidates: Array<{ keyword: string; score: ScoreResult }>,
): Promise<OpportunityEnrichment[]> {
  if (candidates.length === 0) return [];

  const prompt = [
    buildBusinessContextPrompt(businessContext),
    "",
    "Candidate keywords with their score breakdown (0-100 each component):",
    ...candidates.map(
      (c) =>
        `- "${c.keyword}" — demand ${c.score.breakdown.searchDemand}, competition ${c.score.breakdown.competition}, ` +
        `relevance ${c.score.breakdown.businessRelevance}, commercial intent ${c.score.breakdown.commercialIntent}, ` +
        `content gap ${c.score.breakdown.contentGap} (overall score: ${c.score.score})`,
    ),
  ].join("\n");

  try {
    const { object } = await generateObject({
      model: structuredModel,
      schema: opportunityEnrichmentSchema,
      system: SYSTEM_PROMPT,
      prompt,
    });
    return object.opportunities;
  } catch (err) {
    console.error("Opportunity enrichment failed", err);
    throw new ProviderError(
      "Bloggy found opportunities but couldn't finish describing them. Try refreshing in a moment.",
      "ai_generation_failed",
    );
  }
}
