import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { FiTarget, FiChevronRight, FiGlobe, FiSearch, FiEdit3, FiCheckCircle } from "react-icons/fi";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { opportunities, articles, websites } from "@/lib/db/schema";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { listRecentActivity } from "@/lib/activity/activity-queries";
import { describeActivity } from "@/lib/activity/describe-activity";
import { formatRelativeTime } from "@/lib/format";

export const metadata = { title: "Dashboard — Bloggy" };

const ACTIVITY_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  analyzed_website: FiGlobe,
  found_opportunities: FiSearch,
  generated_article: FiEdit3,
  marked_article_ready: FiCheckCircle,
};

export default async function DashboardPage() {
  const { organizationId, user } = await requireOrg();
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
  const firstName = user.name?.split(" ")[0] || "there";

  const waiting = [
    { label: "Opportunities to act on", count: openOpportunities.length, href: "/app/opportunities" },
    { label: "Article ready to review", count: readyArticles.length, href: "/app/articles?status=ready" },
    { label: "Articles in draft", count: draftArticles.length, href: "/app/articles?status=draft" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">
        Good to see you, <span className="text-ink-3">{firstName}</span>.
      </h1>
      <p className="mt-1.5 mb-8 max-w-lg text-[13.5px] text-ink-2">
        {openOpportunities.length > 0
          ? `Bloggy found ${openOpportunities.length} opportunit${openOpportunities.length === 1 ? "y" : "ies"} worth acting on.`
          : "Bloggy is keeping an eye on your search opportunities."}
      </p>

      {nextAction && (
        <Link
          href="/app/opportunities"
          className="mb-8 flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-ink px-6 py-5 transition-colors duration-[var(--dur-color)] hover:bg-action-hover"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-ink-inv">
              <FiTarget size={16} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-white/50">Next best action</p>
              <p className="truncate text-[14.5px] font-medium text-ink-inv">
                Review &ldquo;{nextAction.opportunity.title}&rdquo;
              </p>
            </div>
          </div>
          <span className="mono flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-ink-inv">
            Open
            <FiChevronRight size={12} />
          </span>
        </Link>
      )}

      <div className="mb-8">
        <h2 className="eyebrow mb-3 text-ink-3">What&apos;s waiting</h2>
        <div className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
          {waiting.map((row) => (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-[var(--dur-color)] hover:bg-paper-sunken"
            >
              <span className={`mono text-[20px] font-bold ${row.count === 0 ? "text-ink-3" : "text-ink"}`}>
                {row.count}
              </span>
              <span className={`flex-1 text-[13.5px] ${row.count === 0 ? "text-ink-3" : "text-ink-2"}`}>
                {row.label}
              </span>
              <FiChevronRight size={14} className="shrink-0 text-ink-3" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="eyebrow mb-3 text-ink-3">What Bloggy did</h2>
        {recentActivity.length === 0 ? (
          <p className="text-[13.5px] text-ink-3">Nothing yet.</p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {recentActivity.map((event) => {
              const Icon = ACTIVITY_ICON[event.verb] ?? FiCheckCircle;
              return (
                <li key={event.id} className="flex items-center gap-3">
                  <Icon size={13} className="shrink-0 text-ink-3" />
                  <span className="flex-1 text-[13.5px] text-ink-2">
                    {describeActivity(event.verb, event.payload as Record<string, unknown>)}
                  </span>
                  <span className="mono shrink-0 text-[11.5px] text-ink-3">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/app/activity"
          className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-ink-3 hover:text-ink"
        >
          View all activity
          <FiChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
