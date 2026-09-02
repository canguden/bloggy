import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { websites, websitePages } from "@/lib/db/schema";
import { crawlWebsite, type CrawledPage } from "@/lib/websites/crawler";
import { deriveBusinessContext } from "@/lib/ai/derive-business-context";
import { saveDerivedBusinessContext } from "@/lib/business-context/save-business-context";
import { recordActivity } from "@/lib/activity/record-activity";
import { createId } from "@/lib/ids";
import type { JobHandler } from "../types";

export const analyzeWebsiteHandler: JobHandler = {
  kind: "analyze_website",
  steps: [
    { name: "crawl", label: "Reading your site" },
    { name: "business_context", label: "Understanding your business" },
  ],
  async run(ctx) {
    const websiteId = ctx.job.websiteId;
    if (!websiteId) throw new Error("analyze_website job is missing a websiteId");

    const [website] = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
    if (!website) throw new Error(`Website ${websiteId} no longer exists`);

    await db.update(websites).set({ status: "analyzing" }).where(eq(websites.id, websiteId));

    const pages = await ctx.checkpoint("crawl", "Reading your site", async () => {
      const crawled = await crawlWebsite(website.url);

      for (const page of crawled) {
        await db
          .insert(websitePages)
          .values({
            id: createId("wp"),
            websiteId,
            url: page.url,
            title: page.title,
            h1: page.h1,
            summary: page.summary,
            isIndexable: page.isIndexable,
            contentHash: page.contentHash,
          })
          .onConflictDoUpdate({
            target: [websitePages.websiteId, websitePages.url],
            set: {
              title: page.title,
              h1: page.h1,
              summary: page.summary,
              isIndexable: page.isIndexable,
              contentHash: page.contentHash,
              crawledAt: new Date(),
            },
          });
      }

      return crawled;
    });

    await ctx.checkpoint("business_context", "Understanding your business", async () => {
      const derived = await deriveBusinessContext(website.domain, pages as CrawledPage[]);
      await saveDerivedBusinessContext(websiteId, derived);
      return { offeringsFound: derived.offerings.length };
    });

    await db
      .update(websites)
      .set({ status: "active", lastAnalyzedAt: new Date() })
      .where(eq(websites.id, websiteId));

    await recordActivity({
      organizationId: ctx.job.organizationId,
      verb: "analyzed_website",
      subjectType: "website",
      subjectId: websiteId,
      payload: { domain: website.domain, pagesRead: pages?.length ?? 0 },
    });
  },
};
