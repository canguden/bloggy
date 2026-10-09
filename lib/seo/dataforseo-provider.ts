import "server-only";
import { z } from "zod";
import { env } from "@/lib/config/env";
import { ProviderError } from "@/lib/errors";
import { withProviderCache } from "./provider-cache";
import type { SeoProvider, KeywordIdea, KeywordMetric, SearchIntent } from "./seo-provider";

const API_BASE = "https://api.dataforseo.com/v3";
const DEFAULT_LOCATION_CODE = 2840; // United States
const DEFAULT_LANGUAGE_CODE = "en";
const REQUEST_TIMEOUT_MS = 90_000; // Labs keyword_ideas with large limits routinely takes 30s+

class ProviderAuthError extends ProviderError {
  constructor() {
    super("SEO research isn't authenticated correctly. Please contact support.", "provider_auth_error");
  }
}
class ProviderRateLimitError extends ProviderError {
  constructor() {
    super("SEO research is temporarily rate-limited. Try again in a few minutes.", "provider_rate_limit");
  }
}
class ProviderCreditsError extends ProviderError {
  constructor() {
    super("SEO research is out of credits for now. Your existing data is safe.", "provider_out_of_credits");
  }
}
class ProviderUnavailableError extends ProviderError {
  constructor() {
    super("SEO research is temporarily unavailable. Your website and existing data are safe.", "provider_unavailable");
  }
}
class ProviderMalformedResponseError extends ProviderError {
  constructor() {
    super("SEO research returned an unexpected response. Please try again.", "provider_malformed_response");
  }
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`).toString("base64")}`;
}

const dataForSeoEnvelopeSchema = z.object({
  status_code: z.number(),
  status_message: z.string(),
  tasks: z
    .array(
      z.object({
        status_code: z.number(),
        status_message: z.string(),
        result: z.array(z.unknown()).nullable(),
      }),
    )
    .optional(),
});

async function callDataForSeo(endpoint: string, body: unknown[]): Promise<unknown[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { authorization: authHeader(), "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ProviderUnavailableError();
  }

  if (response.status === 401 || response.status === 403) throw new ProviderAuthError();
  if (response.status === 429) throw new ProviderRateLimitError();
  if (response.status >= 500) throw new ProviderUnavailableError();

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProviderMalformedResponseError();
  }

  const parsed = dataForSeoEnvelopeSchema.safeParse(json);
  if (!parsed.success) throw new ProviderMalformedResponseError();

  // DataForSEO reports auth/credit/rate-limit failures inside a 200 envelope.
  if (parsed.data.status_code === 40101 || parsed.data.status_code === 40100) throw new ProviderAuthError();
  if (parsed.data.status_code === 40202) throw new ProviderRateLimitError();
  if (parsed.data.status_code === 40206) throw new ProviderCreditsError();
  if (parsed.data.status_code >= 20000 && parsed.data.status_code < 30000) {
    const task = parsed.data.tasks?.[0];
    if (!task) throw new ProviderMalformedResponseError();
    if (task.status_code === 40206) throw new ProviderCreditsError();
    if (task.status_code >= 40000) throw new ProviderMalformedResponseError();
    return task.result ?? [];
  }

  throw new ProviderUnavailableError();
}

const intentFromKeywordInfo = (keyword: string): SearchIntent | null => {
  const lower = keyword.toLowerCase();
  if (/(buy|price|pricing|cost|discount|deal|coupon)/.test(lower)) return "transactional";
  if (/(best|top|vs|review|alternative|comparison)/.test(lower)) return "commercial";
  if (/(login|sign in|dashboard)/.test(lower)) return "navigational";
  return "informational";
};

const keywordIdeaItemSchema = z.object({
  keyword: z.string(),
  keyword_info: z
    .object({
      search_volume: z.number().nullable().optional(),
      cpc: z.number().nullable().optional(),
      competition: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

// dataforseo_labs endpoints wrap their actual keyword list one level deeper:
// task.result is an array of "result objects" (usually just one) that each
// carry pagination metadata plus the real list under `.items`.
const keywordIdeasResultSchema = z.object({
  items: z.array(keywordIdeaItemSchema).nullable().optional(),
});

// google_ads/search_volume reports `competition` as a label ("LOW"/"MEDIUM"/"HIGH");
// the numeric signal is `competition_index` (0-100).
const searchVolumeResultSchema = z.object({
  keyword: z.string(),
  search_volume: z.number().nullable().optional(),
  cpc: z.number().nullable().optional(),
  competition_index: z.number().nullable().optional(),
});

const serpResultItemSchema = z.object({
  type: z.string(),
  rank_absolute: z.number().optional(),
  url: z.string().optional(),
  domain: z.string().optional(),
  title: z.string().optional(),
});

const serpTaskResultSchema = z.object({
  keyword: z.string(),
  items: z.array(serpResultItemSchema).nullable().optional(),
});

export const dataForSeoProvider: SeoProvider = {
  async getKeywordIdeas(seeds, limit) {
    const { data } = await withProviderCache(
      "dataforseo",
      "keyword_ideas",
      { seeds, limit },
      1,
      () =>
        callDataForSeo("/dataforseo_labs/google/keyword_ideas/live", [
          {
            keywords: seeds.slice(0, 5),
            language_code: DEFAULT_LANGUAGE_CODE,
            location_code: DEFAULT_LOCATION_CODE,
            limit,
          },
        ]),
    );

    const ideas: KeywordIdea[] = [];
    for (const rawResult of data) {
      const parsedResult = keywordIdeasResultSchema.safeParse(rawResult);
      if (!parsedResult.success) continue;

      for (const item of parsedResult.data.items ?? []) {
        ideas.push({
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? null,
          cpc: item.keyword_info?.cpc ?? null,
          competition: item.keyword_info?.competition ?? null,
          intent: intentFromKeywordInfo(item.keyword),
        });
      }
    }
    return ideas;
  },

  async getKeywordMetrics(keywords) {
    if (keywords.length === 0) return [];

    const { data } = await withProviderCache(
      "dataforseo",
      "keyword_metrics",
      { keywords: [...keywords].sort() },
      1,
      () =>
        callDataForSeo("/keywords_data/google_ads/search_volume/live", [
          {
            keywords: keywords.slice(0, 1000),
            language_code: DEFAULT_LANGUAGE_CODE,
            location_code: DEFAULT_LOCATION_CODE,
          },
        ]),
    );

    const metrics: KeywordMetric[] = [];
    for (const raw of data) {
      const parsed = searchVolumeResultSchema.safeParse(raw);
      if (!parsed.success) continue;
      metrics.push({
        keyword: parsed.data.keyword,
        volume: parsed.data.search_volume ?? null,
        cpc: parsed.data.cpc ?? null,
        competition: parsed.data.competition_index != null ? parsed.data.competition_index / 100 : null,
      });
    }
    return metrics;
  },

  async getSerp(keyword) {
    const { data } = await withProviderCache("dataforseo", "serp", { keyword }, 1, () =>
      callDataForSeo("/serp/google/organic/live/advanced", [
        {
          keyword,
          language_code: DEFAULT_LANGUAGE_CODE,
          location_code: DEFAULT_LOCATION_CODE,
          device: "desktop",
          depth: 10,
        },
      ]),
    );

    const task = data[0];
    const parsed = serpTaskResultSchema.safeParse(task);
    if (!parsed.success) {
      return { keyword, fetchedAt: new Date().toISOString(), results: [] };
    }

    const results = (parsed.data.items ?? [])
      .filter((item) => item.type === "organic" && item.url && item.domain)
      .map((item) => ({
        position: item.rank_absolute ?? 0,
        url: item.url!,
        domain: item.domain!,
        title: item.title ?? "",
      }));

    return { keyword, fetchedAt: new Date().toISOString(), results };
  },
};
