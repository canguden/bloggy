import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { getArticleForOrg, listArticleVersions } from "@/lib/content/article-queries";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { db } from "@/lib/db/client";
import { opportunities, keywords } from "@/lib/db/schema";
import { ArticleEditor } from "@/components/articles/article-editor";

export default async function ArticleDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const { organizationId } = await requireOrg();

  const article = await getArticleForOrg(organizationId, articleId).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
  const [versions, website] = await Promise.all([
    listArticleVersions(articleId),
    getWebsiteForOrg(organizationId, article.websiteId),
  ]);

  let targetKeyword: { keyword: string; volume: number | null } | null = null;
  if (article.opportunityId) {
    const [row] = await db
      .select({ keyword: keywords.keyword, volume: keywords.volume })
      .from(opportunities)
      .innerJoin(keywords, eq(keywords.id, opportunities.targetKeywordId))
      .where(eq(opportunities.id, article.opportunityId))
      .limit(1);
    targetKeyword = row ?? null;
  }

  return (
    <ArticleEditor
      article={article}
      versions={versions}
      targetKeyword={targetKeyword}
      domain={website.domain}
      faviconUrl={website.faviconUrl}
    />
  );
}
