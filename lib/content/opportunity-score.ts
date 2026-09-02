import type { SearchIntent } from "@/lib/seo/seo-provider";

export type ScoreComponents = {
  searchDemand: number; // 0-100
  competition: number; // 0-100, HIGHER is better (i.e. already inverted from raw difficulty)
  businessRelevance: number; // 0-100
  commercialIntent: number; // 0-100
  contentGap: number; // 0-100, 100 = no existing content covers this
};

export type ScoreResult = {
  score: number; // 0-100, integer
  breakdown: ScoreComponents;
};

const WEIGHTS: Record<keyof ScoreComponents, number> = {
  searchDemand: 0.25,
  competition: 0.2,
  businessRelevance: 0.3,
  commercialIntent: 0.15,
  contentGap: 0.1,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Pure, deterministic scoring — this is the number the product shows and
 * ranks by. AI never sets it; it only explains the breakdown afterward.
 */
export function scoreOpportunity(components: ScoreComponents): ScoreResult {
  const clamped: ScoreComponents = {
    searchDemand: clamp(components.searchDemand),
    competition: clamp(components.competition),
    businessRelevance: clamp(components.businessRelevance),
    commercialIntent: clamp(components.commercialIntent),
    contentGap: clamp(components.contentGap),
  };

  const weighted = (Object.keys(WEIGHTS) as Array<keyof ScoreComponents>).reduce(
    (sum, key) => sum + clamped[key] * WEIGHTS[key],
    0,
  );

  return { score: Math.round(weighted), breakdown: clamped };
}

/** Maps raw search volume onto a 0-100 demand score using a log scale (volume is heavily right-skewed). */
export function searchDemandFromVolume(volume: number | null): number {
  if (!volume || volume <= 0) return 5;
  // log10(volume) of 1 (10 searches) -> ~17, of 4 (10,000 searches) -> ~100
  return clamp((Math.log10(volume) / 4) * 100);
}

/** Provider competition is 0-1 (higher = more competitive); we invert it so higher score = easier to win. */
export function competitionScoreFromRaw(competition: number | null): number {
  if (competition == null) return 50; // unknown — treat as medium
  return clamp((1 - competition) * 100);
}

const INTENT_SCORES: Record<SearchIntent, number> = {
  transactional: 100,
  commercial: 80,
  navigational: 20,
  informational: 55,
};

export function commercialIntentScore(intent: SearchIntent | null): number {
  return intent ? INTENT_SCORES[intent] : INTENT_SCORES.informational;
}

/** 100 if nothing on the site already covers this keyword, scaled down by how close an existing page's title/summary matches. */
export function contentGapScore(
  keyword: string,
  existingPages: Array<{ title: string | null; summary: string | null }>,
): number {
  const lowerKeyword = keyword.toLowerCase();
  const hasCloseMatch = existingPages.some((page) => {
    const haystack = `${page.title ?? ""} ${page.summary ?? ""}`.toLowerCase();
    return haystack.includes(lowerKeyword);
  });
  return hasCloseMatch ? 15 : 100;
}

/** Simple lexical overlap between a keyword and the business's own vocabulary — a stand-in for semantic relevance. */
export function businessRelevanceScore(keyword: string, businessVocabulary: string[]): number {
  const lowerKeyword = keyword.toLowerCase();
  const keywordTokens = new Set(lowerKeyword.split(/\s+/).filter((t) => t.length > 2));
  if (keywordTokens.size === 0) return 40;

  const vocabulary = businessVocabulary.join(" ").toLowerCase();
  let matches = 0;
  for (const token of keywordTokens) {
    if (vocabulary.includes(token)) matches++;
  }

  const ratio = matches / keywordTokens.size;
  return clamp(30 + ratio * 70); // baseline 30, up to 100 for full overlap
}
