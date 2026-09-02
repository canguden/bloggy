import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { websites, opportunities, keywords as keywordsTable } from "@/lib/db/schema";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { listWebsitePages } from "@/lib/websites/website-queries";
import { buildSeedKeywords } from "@/lib/seo/build-seed-keywords";
import { seoProvider } from "@/lib/seo";
import { researchBudgetFor, recordUsage } from "@/lib/billing/entitlements";
import {
  upsertKeywordIdeas,
  updateKeywordMetrics,
  getKeywordsByText,
  saveSerpSnapshot,
} from "@/lib/seo/save-research";
import {
  scoreOpportunity,
  searchDemandFromVolume,
  competitionScoreFromRaw,
  commercialIntentScore,
  contentGapScore,
  businessRelevanceScore,
} from "@/lib/content/opportunity-score";
import { enrichOpportunities } from "@/lib/ai/enrich-opportunities";
import { saveOpportunities } from "@/lib/content/save-opportunities";
import { recordActivity } from "@/lib/activity/record-activity";
import type { JobHandler } from "../types";

const MAX_OPPORTUNITIES = 15;

export const researchKeywordsHandler: JobHandler = {
  kind: "research_keywords",
  steps: [
    { name: "keyword_ideas", label: "Researching keywords" },
    { name: "keyword_metrics", label: "Checking search demand" },
    { name: "serp", label: "Evaluating competition" },
    { name: "opportunities", label: "Building your content strategy" },
  ],
  async run(ctx) {
    const websiteId = ctx.job.websiteId;
    if (!websiteId) throw new Error("research_keywords job is missing a websiteId");

    const [website] = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
    if (!website) throw new Error(`Website ${websiteId} no longer exists`);

    const businessContext = await getCurrentBusinessContext(websiteId);
    if (!businessContext) throw new Error("Business context must be derived before research can run");

    const budget = await researchBudgetFor(ctx.job.organizationId);
    const seeds = buildSeedKeywords(businessContext);

    const ideas = await ctx.checkpoint("keyword_ideas", "Researching keywords", async () => {
      const result = await seoProvider.getKeywordIdeas(seeds, budget.maxKeywordIdeas);
      await upsertKeywordIdeas(websiteId, result);
      await recordUsage(ctx.job.organizationId, "keyword_research_units", 1);
      return result;
    });

    // Prioritize by raw volume for the metrics/SERP passes — those budgets are
    // the scarce, credit-consuming resource, so spend them on what already
    // looks promising.
    const byVolumeDesc = [...(ideas ?? [])].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
    const metricsTargets = byVolumeDesc.slice(0, budget.maxKeywordMetricLookups).map((i) => i.keyword);

    await ctx.checkpoint("keyword_metrics", "Checking search demand", async () => {
      if (metricsTargets.length === 0) return { count: 0 };
      const metrics = await seoProvider.getKeywordMetrics(metricsTargets);
      await updateKeywordMetrics(websiteId, metrics);
      await recordUsage(ctx.job.organizationId, "keyword_research_units", 1);
      return { count: metrics.length };
    });

    const serpTargets = byVolumeDesc.slice(0, budget.maxSerpLookups).map((i) => i.keyword);

    await ctx.checkpoint("serp", "Evaluating competition", async () => {
      const relevantKeywordRows = await getKeywordsByText(websiteId, serpTargets);
      const keywordIdByText = new Map(relevantKeywordRows.map((k) => [k.keyword, k.id]));

      for (const keyword of serpTargets) {
        const keywordId = keywordIdByText.get(keyword);
        if (!keywordId) continue;
        const snapshot = await seoProvider.getSerp(keyword);
        await saveSerpSnapshot(websiteId, keywordId, website.domain, snapshot);
        await recordUsage(ctx.job.organizationId, "keyword_research_units", 1);
      }
      return { count: serpTargets.length };
    });

    const opportunitiesCreated = await ctx.checkpoint(
      "opportunities",
      "Building your content strategy",
      async () => {
        const existing = await db
          .select({ targetKeywordId: opportunities.targetKeywordId })
          .from(opportunities)
          .where(eq(opportunities.websiteId, websiteId));
        const alreadyCovered = new Set(existing.map((o) => o.targetKeywordId).filter(Boolean));

        const allKeywordRows = await db
          .select()
          .from(keywordsTable)
          .where(inArray(keywordsTable.keyword, byVolumeDesc.map((i) => i.keyword)));
        const rowsByText = new Map(allKeywordRows.map((k) => [k.keyword, k]));

        const pages = await listWebsitePages(websiteId);
        const businessVocabulary = [
          ...businessContext.offerings.map((o) => o.name),
          ...businessContext.context.useCases,
          ...businessContext.context.customerProblems,
          ...businessContext.context.differentiators,
        ];

        const candidates = byVolumeDesc
          .map((idea) => {
            const row = rowsByText.get(idea.keyword);
            if (!row || alreadyCovered.has(row.id)) return null;

            const score = scoreOpportunity({
              searchDemand: searchDemandFromVolume(row.volume),
              competition: competitionScoreFromRaw(idea.competition),
              businessRelevance: businessRelevanceScore(idea.keyword, businessVocabulary),
              commercialIntent: commercialIntentScore(idea.intent),
              contentGap: contentGapScore(idea.keyword, pages),
            });

            return { keyword: idea.keyword, score, relatedKeywords: [] as string[] };
          })
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .sort((a, b) => b.score.score - a.score.score)
          .slice(0, MAX_OPPORTUNITIES);

        if (candidates.length === 0) return { count: 0 };

        const enrichment = await enrichOpportunities(businessContext, candidates);
        const keywordIdsByText = new Map(
          candidates.map((c) => [c.keyword, rowsByText.get(c.keyword)!.id]),
        );
        const count = await saveOpportunities(websiteId, keywordIdsByText, candidates, enrichment);
        return { count };
      },
    );

    await recordActivity({
      organizationId: ctx.job.organizationId,
      verb: "found_opportunities",
      subjectType: "website",
      subjectId: websiteId,
      payload: { count: opportunitiesCreated?.count ?? 0 },
    });
  },
};
