import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";

const MAX_SEEDS = 5;

/** Turns the Business Context into a handful of seed phrases for keyword expansion. */
export function buildSeedKeywords(details: NonNullable<BusinessContextWithDetails>): string[] {
  const { context, offerings } = details;
  const candidates = [
    ...offerings.map((o) => o.name),
    ...context.useCases,
    ...context.customerProblems,
  ].filter((c) => c.trim().length > 0);

  return Array.from(new Set(candidates)).slice(0, MAX_SEEDS);
}
