import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanLimits } from "@/lib/billing/plans";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Settings — Bloggy" };

export default async function SettingsPage() {
  const { organizationId, user } = await requireOrg();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  const limits = getPlanLimits("free");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">Settings</h1>

      <Card className="mb-6 p-6">
        <h2 className="mb-3 text-[var(--text-sm)] font-medium text-[var(--text-muted)]">Workspace</h2>
        <p className="text-[var(--text-base)] text-[var(--text-primary)]">{org?.name}</p>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{user.email}</p>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 text-[var(--text-sm)] font-medium text-[var(--text-muted)]">Plan</h2>
        <p className="mb-1 text-[var(--text-base)] text-[var(--text-primary)]">Free</p>
        <ul className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          <li>{limits.maxWebsites} website</li>
          <li>{limits.maxArticlesPerMonth} articles per month</li>
          <li>Up to {limits.research.maxKeywordIdeas} keywords researched per run</li>
        </ul>
        <p className="mt-4 text-[var(--text-xs)] text-[var(--text-muted)]">
          Billing and plan upgrades are coming soon.
        </p>
      </Card>
    </div>
  );
}
