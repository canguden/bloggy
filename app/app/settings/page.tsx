import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { getPlanLimits } from "@/lib/billing/plans";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata = { title: "Settings — Bloggy" };

export default async function SettingsPage() {
  const { organizationId, user } = await requireOrg();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  const limits = getPlanLimits("free");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthArticles = await db.query.articles.findMany({
    where: (a, { and, eq, gte }) => and(eq(a.organizationId, organizationId), gte(a.createdAt, startOfMonth)),
    columns: { id: true },
  });
  const usedThisMonth = monthArticles.length;
  const usagePct = limits.maxArticlesPerMonth > 0 ? Math.min(100, (usedThisMonth / limits.maxArticlesPerMonth) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <PageHeader title="Settings" />

      <section className="mb-10">
        <h2 className="eyebrow mb-3 text-ink-3">Workspace</h2>
        <div className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
          <SettingsRow label="Name" value={org?.name ?? "—"} />
          <SettingsRow label="Email" value={user.email} />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3 text-ink-3">Plan</h2>
        <div className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
          <SettingsRow label="Current plan" value="Free" />
          <SettingsRow label="Websites" value={`${limits.maxWebsites}`} />
          <SettingsRow label="Keywords per research run" value={`Up to ${limits.research.maxKeywordIdeas}`} />
          <div className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ink-2">Articles this month</span>
              <span className="mono text-[12.5px] text-ink-3">
                {usedThisMonth} of {limits.maxArticlesPerMonth}
              </span>
            </div>
            <ProgressBar value={usagePct} />
          </div>
        </div>
        <p className="mt-3 text-[12.5px] text-ink-3">Billing and plan upgrades are coming soon.</p>
      </section>
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="text-[13.5px] font-medium text-ink">{value}</span>
    </div>
  );
}
