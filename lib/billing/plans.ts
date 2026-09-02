/**
 * The single source of truth for plan limits. Everything else asks
 * questions (canRunKeywordResearch, researchBudgetFor) rather than
 * inspecting these values directly.
 */
export const PLAN_LIMITS = {
  free: {
    maxWebsites: 1,
    maxArticlesPerMonth: 5,
    research: {
      maxKeywordIdeas: 30,
      maxKeywordMetricLookups: 50,
      maxSerpLookups: 10,
    },
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanId] ?? PLAN_LIMITS.free;
}
