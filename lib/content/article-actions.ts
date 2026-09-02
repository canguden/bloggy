"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { articles } from "@/lib/db/schema";
import { getOpportunityForOrg } from "./opportunity-queries";
import { getArticleForOrg } from "./article-queries";
import { enqueueJob } from "@/lib/jobs/enqueue-job";
import { canGenerateArticle } from "@/lib/billing/entitlements";
import { updateArticleContent } from "./save-article-version";
import { recordActivity } from "@/lib/activity/record-activity";
import { ValidationError, toUserMessage } from "@/lib/errors";
import { z } from "zod";

export async function generateArticleAction(
  opportunityId: string,
): Promise<{ success: true; articleId: string } | { success: false; error: string }> {
  try {
    const { organizationId } = await requireOrg();
    const { opportunity } = await getOpportunityForOrg(organizationId, opportunityId); // authorization check

    if (!(await canGenerateArticle(organizationId))) {
      throw new ValidationError("You've reached this month's article limit on your current plan.");
    }

    const jobId = await enqueueJob({
      organizationId,
      websiteId: opportunity.websiteId,
      kind: "generate_article",
      input: { opportunityId },
    });

    // The article row is created by the job itself (once generation
    // succeeds), so we hand the caller the job id via a lookup page instead
    // of a real article id — see /app/articles/pending/[jobId].
    return { success: true, articleId: `pending/${jobId}` };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}

const updateSchema = z.object({
  articleId: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export async function saveArticleAction(input: {
  articleId: string;
  title: string;
  body: string;
  reason: "edit_explicit" | "edit_autosave";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, organizationId } = await requireOrg();
    const parsed = updateSchema.parse(input);
    await getArticleForOrg(organizationId, parsed.articleId); // authorization check

    await updateArticleContent(parsed.articleId, { title: parsed.title, body: parsed.body }, input.reason, user.id);
    revalidatePath(`/app/articles/${parsed.articleId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}

/**
 * Approves the draft for publication. This does NOT publish to a real CMS —
 * that requires a publishing-provider integration (pass 2). "ready" means
 * "reviewed and approved," never "live on your site."
 */
export async function markArticleReadyAction(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    const article = await getArticleForOrg(organizationId, articleId); // authorization check

    await db.update(articles).set({ status: "ready" }).where(eq(articles.id, articleId));
    await updateArticleContent(articleId, { title: article.title, body: article.body }, "status_change");
    await recordActivity({
      organizationId,
      actor: "user",
      verb: "marked_article_ready",
      subjectType: "article",
      subjectId: articleId,
    });

    revalidatePath(`/app/articles/${articleId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}
