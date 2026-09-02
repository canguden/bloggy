import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  real,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { websites } from "./website";

export const searchIntentEnum = pgEnum("search_intent", [
  "informational",
  "commercial",
  "transactional",
  "navigational",
]);

export const keywordSourceEnum = pgEnum("keyword_source", ["dataforseo", "manual"]);

/** Normalized keyword data — the source of truth the app reads, never raw provider JSON. */
export const keywords = pgTable(
  "keywords",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    volume: integer("volume"),
    difficulty: real("difficulty"), // 0-100 normalized
    cpc: real("cpc"),
    intent: searchIntentEnum("intent"),
    source: keywordSourceEnum("source").notNull().default("dataforseo"),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("keywords_website_keyword_unique").on(table.websiteId, table.keyword),
    index("keywords_website_idx").on(table.websiteId),
  ],
);

export const serpSnapshots = pgTable(
  "serp_snapshots",
  {
    id: text("id").primaryKey(),
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    // normalized: [{ position, url, domain, title }]
    results: jsonb("results").notNull(),
  },
  (table) => [index("serp_snapshots_keyword_idx").on(table.keywordId)],
);

export const competitors = pgTable(
  "competitors",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    discoveredFrom: text("discovered_from"), // e.g. keyword that surfaced it
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("competitors_website_domain_unique").on(table.websiteId, table.domain),
    index("competitors_website_idx").on(table.websiteId),
  ],
);

/**
 * Transient read-through cache for provider requests, keyed by a hash of
 * endpoint+params. Per-entity TTL is set by the caller via `expiresAt`; this
 * table is pruned and is never read directly by product code — callers always
 * go through the normalized tables above.
 */
export const providerCache = pgTable(
  "provider_cache",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    endpoint: text("endpoint").notNull(),
    requestHash: text("request_hash").notNull(),
    response: jsonb("response").notNull(),
    costUnits: integer("cost_units").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("provider_cache_request_hash_unique").on(table.requestHash),
    index("provider_cache_expires_idx").on(table.expiresAt),
  ],
);
