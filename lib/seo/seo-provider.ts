/**
 * The application only ever talks to SEO data through this interface — no UI
 * or business logic knows DataForSEO's request/response shapes. Domain types
 * below are what every provider implementation normalizes into.
 */

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export type KeywordIdea = {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null; // 0-1, provider-reported competition
  intent: SearchIntent | null;
};

export type KeywordMetric = {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null;
};

export type SerpResult = {
  position: number;
  url: string;
  domain: string;
  title: string;
};

export type SerpSnapshot = {
  keyword: string;
  fetchedAt: string;
  results: SerpResult[];
};

export interface SeoProvider {
  /** Expands a small set of seed terms into related keyword ideas. */
  getKeywordIdeas(seeds: string[], limit: number): Promise<KeywordIdea[]>;
  /** Volume/CPC/competition for a specific, already-known list of keywords. */
  getKeywordMetrics(keywords: string[]): Promise<KeywordMetric[]>;
  /** Live organic SERP for one keyword. */
  getSerp(keyword: string): Promise<SerpSnapshot>;
}
