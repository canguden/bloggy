import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { listArticlesForOrg } from "@/lib/content/article-queries";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Articles — Bloggy" };

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  draft: "neutral",
  review: "accent",
  ready: "success",
  published: "success",
  updating: "accent",
  archived: "neutral",
  failed: "danger",
};

export default async function ArticlesPage() {
  const { organizationId } = await requireOrg();
  const rows = await listArticlesForOrg(organizationId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">Articles</h1>
      <p className="mb-8 text-[var(--text-sm)] text-[var(--text-secondary)]">
        Everything Bloggy has written, and everything you&apos;ve reviewed.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Bloggy hasn't written anything yet. Find a content opportunity to get started."
          action={
            <Link href="/app/opportunities" className="text-[var(--text-sm)] font-medium text-[var(--accent)] hover:underline">
              Find opportunities →
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
          {rows.map(({ article, website }) => (
            <li key={article.id}>
              <Link
                href={`/app/articles/${article.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--surface-sunken)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[var(--text-base)] font-medium text-[var(--text-primary)]">
                    {article.title}
                  </p>
                  <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{website.domain}</p>
                </div>
                <Badge tone={STATUS_TONE[article.status]}>{article.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
