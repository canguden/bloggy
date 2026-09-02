import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articles, articleVersions, websites } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";

export async function listArticlesForOrg(organizationId: string) {
  return db
    .select({ article: articles, website: websites })
    .from(articles)
    .innerJoin(websites, eq(websites.id, articles.websiteId))
    .where(eq(articles.organizationId, organizationId))
    .orderBy(desc(articles.updatedAt));
}

export async function getArticleForOrg(organizationId: string, articleId: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.organizationId, organizationId)))
    .limit(1);

  if (!article) throw new NotFoundError("Article");
  return article;
}

export async function listArticleVersions(articleId: string) {
  return db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.articleId, articleId))
    .orderBy(desc(articleVersions.createdAt));
}
