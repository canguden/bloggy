import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  opportunities,
  keywords,
  serpSnapshots,
  websites,
  articles,
  contentBriefs,
} from "@/lib/db/schema";
import { listWebsitePages } from "@/lib/websites/website-queries";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { generateBrief } from "@/lib/ai/generate-brief";
import { generateArticle } from "@/lib/ai/generate-article";
import { updateArticleContent } from "@/lib/content/save-article-version";
import { slugify } from "@/lib/content/slugify";
import { createId } from "@/lib/ids";
import { recordUsage } from "@/lib/billing/entitlements";
import { recordActivity } from "@/lib/activity/record-activity";
import type { SerpResult } from "@/lib/seo/seo-provider";
import type { JobHandler } from "../types";

async function createArticleWithUniqueSlug(params: {
  organizationId: string;
  websiteId: string;
  opportunityId: string;
  briefId: string;
  title: string;
}): Promise<string> {
  const baseSlug = slugify(params.title) || "article";

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const id = createId("art");
    try {
      await db.insert(articles).values({
        id,
        organizationId: params.organizationId,
        websiteId: params.websiteId,
        opportunityId: params.opportunityId,
        briefId: params.briefId,
        slug,
        title: params.title,
        status: "draft",
      });
      return id;
    } catch (err) {
      const isUniqueViolation = (err as { code?: string; cause?: { code?: string } })?.code === "23505" ||
        (err as { cause?: { code?: string } })?.cause?.code === "23505";
      if (!isUniqueViolation || attempt === 4) throw err;
    }
  }
  throw new Error("Could not allocate a unique slug");
}

export const generateArticleHandler: JobHandler = {
  kind: "generate_article",
  steps: [
    { name: "brief", label: "Researching your angle" },
    { name: "article", label: "Writing your article" },
  ],
  async run(ctx) {
    const opportunityId = (ctx.job.input as { opportunityId?: string } | null)?.opportunityId;
    if (!opportunityId) throw new Error("generate_article job is missing an opportunityId");

    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
    if (!opportunity) throw new Error(`Opportunity ${opportunityId} no longer exists`);

    const websiteId = opportunity.websiteId;
    const [website] = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
    if (!website) throw new Error(`Website ${websiteId} no longer exists`);

    const businessContext = await getCurrentBusinessContext(websiteId);
    if (!businessContext) throw new Error("Business context is required to generate an article");

    const [targetKeyword] = opportunity.targetKeywordId
      ? await db.select().from(keywords).where(eq(keywords.id, opportunity.targetKeywordId)).limit(1)
      : [];
    const keywordText = targetKeyword?.keyword ?? opportunity.title;

    const briefId = await ctx.checkpoint("brief", "Researching your angle", async () => {
      const [latestSerp] = targetKeyword
        ? await db
            .select()
            .from(serpSnapshots)
            .where(eq(serpSnapshots.keywordId, targetKeyword.id))
            .orderBy(desc(serpSnapshots.fetchedAt))
            .limit(1)
        : [];
      const competitorTitles = ((latestSerp?.results as SerpResult[]) ?? [])
        .map((r) => r.title)
        .filter(Boolean)
        .slice(0, 10);

      const pages = await listWebsitePages(websiteId);
      const internalPages = pages.filter((p) => p.isIndexable).slice(0, 10);

      const brief = await generateBrief({
        businessContext,
        targetKeyword: keywordText,
        opportunityTitle: opportunity.title,
        rationale: opportunity.rationale,
        competitorTitles,
        internalPages: internalPages.map((p) => ({ url: p.url, title: p.title })),
      });

      const briefId = createId("brief");
      await db.insert(contentBriefs).values({
        id: briefId,
        opportunityId,
        angle: brief.angle,
        outline: brief.outline,
        targetWordCount: brief.targetWordCount,
        internalLinkTargets: brief.internalLinkTargets,
        competitorUrls: [],
        contentGap: brief.contentGap,
        cta: brief.cta,
      });

      return { id: briefId, brief };
    });

    if (!briefId) throw new Error("Brief step did not complete");

    await ctx.checkpoint("article", "Writing your article", async () => {
      const draft = await generateArticle({
        businessContext,
        brief: briefId.brief,
        targetKeyword: keywordText,
        title: opportunity.title,
      });

      const articleId = await createArticleWithUniqueSlug({
        organizationId: ctx.job.organizationId,
        websiteId,
        opportunityId,
        briefId: briefId.id,
        title: draft.title,
      });

      await db.update(articles).set({ metaDescription: draft.metaDescription }).where(eq(articles.id, articleId));
      await updateArticleContent(articleId, { title: draft.title, body: draft.body }, "generated");
      await db.update(opportunities).set({ status: "done" }).where(eq(opportunities.id, opportunityId));
      await recordUsage(ctx.job.organizationId, "articles_generated", 1);
      await recordActivity({
        organizationId: ctx.job.organizationId,
        verb: "generated_article",
        subjectType: "article",
        subjectId: articleId,
        payload: { title: draft.title },
      });

      return { articleId };
    });
  },
};
