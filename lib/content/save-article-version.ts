import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articles, articleVersions } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { contentHash } from "./article-body";

const COALESCE_WINDOW_MS = 2 * 60 * 1000;

export type VersionReason = "generated" | "edit_explicit" | "edit_autosave" | "status_change";

/**
 * Updates the article's live content and decides whether that counts as a
 * new version. Generated drafts, explicit saves, and status changes always
 * snapshot. Autosaves coalesce into the most recent autosave version if one
 * was created within the last two minutes, and are skipped entirely when the
 * content hasn't actually changed — so typing for 20 minutes doesn't create
 * 20 minutes of versions.
 */
export async function updateArticleContent(
  articleId: string,
  content: { title: string; body: string },
  reason: VersionReason,
  createdBy: string | null = null,
): Promise<void> {
  const hash = contentHash(content.body);

  await db
    .update(articles)
    .set({ title: content.title, body: content.body, updatedAt: new Date() })
    .where(eq(articles.id, articleId));

  const [lastVersion] = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.articleId, articleId))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1);

  if (lastVersion?.contentHash === hash) return; // no real change — nothing to snapshot

  const shouldCoalesce =
    reason === "edit_autosave" &&
    lastVersion?.reason === "edit_autosave" &&
    Date.now() - lastVersion.createdAt.getTime() < COALESCE_WINDOW_MS;

  if (shouldCoalesce && lastVersion) {
    await db
      .update(articleVersions)
      .set({ title: content.title, body: content.body, contentHash: hash })
      .where(eq(articleVersions.id, lastVersion.id));
    return;
  }

  await db.insert(articleVersions).values({
    id: createId("aver"),
    articleId,
    title: content.title,
    body: content.body,
    contentHash: hash,
    createdBy,
    reason,
  });
}
