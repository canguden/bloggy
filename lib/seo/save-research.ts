import "server-only";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { keywords, serpSnapshots, competitors } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import type { KeywordIdea, KeywordMetric, SerpSnapshot } from "./seo-provider";

export async function upsertKeywordIdeas(websiteId: string, ideas: KeywordIdea[]): Promise<void> {
  for (const idea of ideas) {
    await db
      .insert(keywords)
      .values({
        id: createId("kw"),
        websiteId,
        keyword: idea.keyword,
        volume: idea.volume,
        cpc: idea.cpc,
        difficulty: idea.competition != null ? idea.competition * 100 : null,
        intent: idea.intent,
        source: "dataforseo",
        lastRefreshedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [keywords.websiteId, keywords.keyword],
        set: {
          volume: idea.volume,
          cpc: idea.cpc,
          difficulty: idea.competition != null ? idea.competition * 100 : null,
          intent: idea.intent,
          lastRefreshedAt: new Date(),
        },
      });
  }
}

export async function updateKeywordMetrics(websiteId: string, metrics: KeywordMetric[]): Promise<void> {
  for (const metric of metrics) {
    await db
      .update(keywords)
      .set({
        volume: metric.volume,
        cpc: metric.cpc,
        difficulty: metric.competition != null ? metric.competition * 100 : null,
        lastRefreshedAt: new Date(),
      })
      .where(and(eq(keywords.websiteId, websiteId), eq(keywords.keyword, metric.keyword)));
  }
}

export async function getKeywordsByText(websiteId: string, texts: string[]) {
  if (texts.length === 0) return [];
  return db
    .select()
    .from(keywords)
    .where(and(eq(keywords.websiteId, websiteId), inArray(keywords.keyword, texts)));
}

export async function listKeywordsForWebsite(websiteId: string) {
  return db.select().from(keywords).where(eq(keywords.websiteId, websiteId));
}

/** Stores a SERP snapshot and discovers competitors from the result domains (excluding the site's own domain). */
export async function saveSerpSnapshot(
  websiteId: string,
  keywordId: string,
  ownDomain: string,
  snapshot: SerpSnapshot,
): Promise<void> {
  await db.insert(serpSnapshots).values({
    id: createId("serp"),
    keywordId,
    fetchedAt: new Date(snapshot.fetchedAt),
    results: snapshot.results,
  });

  const competitorDomains = new Set(
    snapshot.results.filter((r) => r.domain !== ownDomain && !r.domain.endsWith(`.${ownDomain}`)).map((r) => r.domain),
  );

  for (const domain of competitorDomains) {
    await db
      .insert(competitors)
      .values({ id: createId("comp"), websiteId, domain, discoveredFrom: snapshot.keyword })
      .onConflictDoNothing({ target: [competitors.websiteId, competitors.domain] });
  }
}
