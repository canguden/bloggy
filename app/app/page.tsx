import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { opportunities, articles, websites } from "@/lib/db/schema";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { listRecentActivity } from "@/lib/activity/activity-queries";
import { describeActivity } from "@/lib/activity/describe-activity";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Dashboard — Bloggy" };

export default async function DashboardPage() {
  const { organizationId } = await requireOrg();
  const sites = await listWebsitesForOrg(organizationId);

  if (sites.length === 0) redirect("/app/websites");

  const [openOpportunities, draftArticles, readyArticles, recentActivity] = await Promise.all([
    db
      .select({ opportunity: opportunities, website: websites })
      .from(opportunities)
      .innerJoin(websites, eq(websites.id, opportunities.websiteId))
      .where(and(eq(websites.organizationId, organizationId), eq(opportunities.status, "new")))
      .orderBy(desc(opportunities.score))
      .limit(3),
    db
      .select({ article: articles, website: websites })
      .from(articles)
      .innerJoin(websites, eq(websites.id, articles.websiteId))
      .where(and(eq(articles.organizationId, organizationId), eq(articles.status, "draft")))
      .orderBy(desc(articles.updatedAt))
      .limit(5),
    db
      .select({ article: articles })
      .from(articles)
      .where(and(eq(articles.organizationId, organizationId), eq(articles.status, "ready")))
      .limit(20),
    listRecentActivity(organizationId, 6),
  ]);

  const nextAction = openOpportunities[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
        Good to see you
      </h1>
      <p className="mb-8 text-[var(--text-sm)] text-[var(--text-secondary)]">
        {openOpportunities.length > 0
          ? `Bloggy has ${openOpportunities.length} opportunit${openOpportunities.length === 1 ? "y" : "ies"} worth acting on.`
          : "Bloggy is keeping an eye on your search opportunities."}
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Opportunities to act on" value={openOpportunities.length} href="/app/opportunities" />
        <StatCard label="Articles in draft" value={draftArticles.length} href="/app/articles" />
        <StatCard label="Ready to publish" value={readyArticles.length} href="/app/articles" />
      </div>

      {nextAction && (
        <Card className="mb-8 flex items-center justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Next best action
            </p>
            <p className="text-[var(--text-base)] font-medium text-[var(--text-primary)]">
              Review &ldquo;{nextAction.opportunity.title}&rdquo;
            </p>
          </div>
          <Link
            href="/app/opportunities"
            className="shrink-0 text-[var(--text-sm)] font-medium text-[var(--accent)] hover:underline"
          >
            Review →
          </Link>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-[var(--text-sm)] font-medium text-[var(--text-muted)]">Recently</h2>
        {recentActivity.length === 0 ? (
          <p className="text-[var(--text-sm)] text-[var(--text-muted)]">Nothing yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentActivity.map((event) => (
              <li key={event.id} className="flex items-baseline gap-2 text-[var(--text-sm)]">
                <span className="text-[var(--text-primary)]">
                  {describeActivity(event.verb, event.payload as Record<string, unknown>)}
                </span>
                <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
                  {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-colors hover:bg-[var(--surface-sunken)]">
        <p className="font-serif text-[var(--text-3xl)] font-semibold text-[var(--text-primary)]">{value}</p>
        <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{label}</p>
      </Card>
    </Link>
  );
}
