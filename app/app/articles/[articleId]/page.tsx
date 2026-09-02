import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { getArticleForOrg, listArticleVersions } from "@/lib/content/article-queries";
import { db } from "@/lib/db/client";
import { opportunities, keywords } from "@/lib/db/schema";
import { ArticleEditor } from "@/components/articles/article-editor";

export default async function ArticleDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const { organizationId } = await requireOrg();

  const article = await getArticleForOrg(organizationId, articleId);
  const versions = await listArticleVersions(articleId);

  let targetKeyword: string | null = null;
  if (article.opportunityId) {
    const [row] = await db
      .select({ keyword: keywords.keyword })
      .from(opportunities)
      .innerJoin(keywords, eq(keywords.id, opportunities.targetKeywordId))
      .where(eq(opportunities.id, article.opportunityId))
      .limit(1);
    targetKeyword = row?.keyword ?? null;
  }

  return <ArticleEditor article={article} versions={versions} targetKeyword={targetKeyword} />;
}
