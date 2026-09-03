import Link from "next/link";
import { FiFileText, FiChevronRight } from "react-icons/fi";
import { requireOrg } from "@/lib/auth/session";
import { listArticlesForOrg } from "@/lib/content/article-queries";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SiteChip } from "@/components/ui/site-chip";
import { formatRelativeTime } from "@/lib/format";
import { ArticleStatusFilter } from "@/components/articles/article-status-filter";
import type { Tone } from "@/components/ui/badge";

export const metadata = { title: "Articles — Bloggy" };

const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  review: "accent",
  ready: "ok",
  published: "ok",
  updating: "accent",
  archived: "neutral",
  failed: "bad",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { organizationId } = await requireOrg();
  const { status } = await searchParams;
  const rows = await listArticlesForOrg(organizationId);

  const filtered =
    status === "draft"
      ? rows.filter((r) => r.article.status === "draft")
      : status === "ready"
        ? rows.filter((r) => r.article.status === "ready" || r.article.status === "published")
        : rows;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <PageHeader
        title="Articles"
        description="Everything Bloggy has written, and everything you've reviewed."
        action={<ArticleStatusFilter current={status === "draft" || status === "ready" ? status : "all"} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<FiFileText size={18} />}
          title="No articles yet"
          description="Bloggy hasn't written anything yet. Find a content opportunity to get started."
          action={
            <Link href="/app/opportunities" className="text-[13.5px] font-medium text-accent-ink hover:underline">
              Find opportunities
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FiFileText size={18} />} title="Nothing here" description="No articles match this filter." />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper-raised">
          {filtered.map(({ article, website }) => (
            <li key={article.id}>
              <Link
                href={`/app/articles/${article.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-[var(--dur-color)] hover:bg-paper-sunken"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium text-ink">{article.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <SiteChip domain={website.domain} faviconUrl={website.faviconUrl} size="sm" />
                    <span className="mono text-[11.5px] text-ink-3">
                      {formatRelativeTime(article.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={STATUS_TONE[article.status]}>{article.status}</Badge>
                  <FiChevronRight size={15} className="text-ink-3" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
