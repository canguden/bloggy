export type ResearchBudget = {
  maxKeywordIdeas: number;
  maxKeywordMetricLookups: number;
  maxSerpLookups: number;
};

/** Human-readable preflight estimate shown to the user before a research run starts. */
export function describeBudget(budget: ResearchBudget): string {
  return `This analysis will research up to ${budget.maxKeywordIdeas} keyword ideas and check live search results for up to ${budget.maxSerpLookups} of them.`;
}
