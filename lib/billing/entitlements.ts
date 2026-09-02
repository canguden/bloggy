import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscriptions, usageCounters, websites } from "@/lib/db/schema";
import { getPlanLimits } from "./plans";
import { createId } from "@/lib/ids";

/**
 * The rest of the app asks questions (canGenerateArticle, researchBudgetFor)
 * instead of inspecting Stripe/subscription rows directly — this is the only
 * module that reads `subscriptions`.
 */
async function getPlan(organizationId: string): Promise<string> {
  const [sub] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  return sub?.plan ?? "free";
}

function currentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function getUsage(organizationId: string, metric: string): Promise<number> {
  const [row] = await db
    .select({ count: usageCounters.count })
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.organizationId, organizationId),
        eq(usageCounters.metric, metric),
        eq(usageCounters.periodStart, currentPeriodStart()),
      ),
    )
    .limit(1);
  return row?.count ?? 0;
}

export async function recordUsage(organizationId: string, metric: string, amount = 1): Promise<void> {
  if (amount <= 0) return;
  const periodStart = currentPeriodStart();

  await db
    .insert(usageCounters)
    .values({
      id: createId("usage"),
      organizationId,
      metric,
      periodStart,
      count: amount,
    })
    .onConflictDoUpdate({
      target: [usageCounters.organizationId, usageCounters.metric, usageCounters.periodStart],
      set: { count: sql`${usageCounters.count} + ${amount}` },
    });
}

export async function canAddWebsite(organizationId: string): Promise<boolean> {
  const limits = getPlanLimits(await getPlan(organizationId));
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(websites)
    .where(eq(websites.organizationId, organizationId));
  return count < limits.maxWebsites;
}

export async function canGenerateArticle(organizationId: string): Promise<boolean> {
  const limits = getPlanLimits(await getPlan(organizationId));
  const usedThisMonth = await getUsage(organizationId, "articles_generated");
  return usedThisMonth < limits.maxArticlesPerMonth;
}

/**
 * The credit-aware budget for one research run. Every DataForSEO adapter
 * call is expected to stay within these bounds — the research job hard-stops
 * at them rather than draining credits silently.
 */
export async function researchBudgetFor(organizationId: string) {
  const limits = getPlanLimits(await getPlan(organizationId));
  return limits.research;
}
