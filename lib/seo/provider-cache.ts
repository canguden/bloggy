import "server-only";
import { createHash } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { providerCache } from "@/lib/db/schema";
import { createId } from "@/lib/ids";

/**
 * Per-entity TTLs — a SERP goes stale much faster than a keyword-ideas list.
 * This cache is a transient read-through layer over the provider: on a hit,
 * the app makes zero outbound calls and spends zero credits. It is never
 * read directly by product code — callers get normalized domain objects back
 * and write them into the real tables (keywords/serp_snapshots/competitors).
 */
export const CACHE_TTL_MS = {
  keyword_ideas: 30 * 24 * 60 * 60 * 1000,
  keyword_metrics: 10 * 24 * 60 * 60 * 1000,
  serp: 5 * 24 * 60 * 60 * 1000,
} as const;

export type CacheEndpoint = keyof typeof CACHE_TTL_MS;

function hashRequest(provider: string, endpoint: string, params: unknown): string {
  return createHash("sha256").update(`${provider}:${endpoint}:${JSON.stringify(params)}`).digest("hex");
}

/**
 * Returns the cached response if a fresh entry exists; otherwise calls
 * `fetcher`, stores the result with the endpoint's TTL and reported cost, and
 * returns it. `costUnits` is 0 on a cache hit — this is what makes repeat
 * research free.
 */
export async function withProviderCache<T>(
  provider: string,
  endpoint: CacheEndpoint,
  params: unknown,
  costUnits: number,
  fetcher: () => Promise<T>,
): Promise<{ data: T; cached: boolean; costUnits: number }> {
  const requestHash = hashRequest(provider, endpoint, params);

  const [existing] = await db
    .select()
    .from(providerCache)
    .where(eq(providerCache.requestHash, requestHash))
    .limit(1);

  if (existing && existing.expiresAt.getTime() > Date.now()) {
    return { data: existing.response as T, cached: true, costUnits: 0 };
  }

  const data = await fetcher();
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS[endpoint]);

  await db
    .insert(providerCache)
    .values({ id: createId("pc"), provider, endpoint, requestHash, response: data as object, costUnits, expiresAt })
    .onConflictDoUpdate({
      target: providerCache.requestHash,
      set: { response: data as object, costUnits, expiresAt, createdAt: new Date() },
    });

  return { data, cached: false, costUnits };
}

/** Removes expired entries. Cheap to run opportunistically; not load-bearing for correctness. */
export async function pruneExpiredCache(): Promise<void> {
  await db.delete(providerCache).where(lt(providerCache.expiresAt, new Date()));
}
