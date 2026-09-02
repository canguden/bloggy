import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  real,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { websites } from "./website";

export const businessContextSourceEnum = pgEnum("business_context_source", [
  "derived", // produced from a crawl by AI
  "user_edited", // corrected by the user; not overwritten by later derivations
]);

/**
 * The most valuable asset Bloggy holds about a customer's business. Versioned:
 * a re-derivation inserts a new row and flips `isCurrent`, so a regeneration is
 * reviewable rather than destructive. Only one row per website has isCurrent=true.
 */
export const businessContexts = pgTable(
  "business_contexts",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    source: businessContextSourceEnum("source").notNull().default("derived"),
    confidence: real("confidence"), // 0-1, null once user-edited

    summary: text("summary").notNull(), // one paragraph, what the business does
    industries: text("industries").array().notNull().default([]),
    locations: text("locations").array().notNull().default([]),
    customerProblems: text("customer_problems").array().notNull().default([]),
    useCases: text("use_cases").array().notNull().default([]),
    differentiators: text("differentiators").array().notNull().default([]),
    brandVoice: text("brand_voice"), // e.g. "direct, technical, no hype"
    commercialPriorities: text("commercial_priorities").array().notNull().default([]),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("business_contexts_website_idx").on(table.websiteId),
    uniqueIndex("business_contexts_website_current_unique")
      .on(table.websiteId)
      .where(sql`${table.isCurrent} = true`),
  ],
);

export const businessOfferings = pgTable(
  "business_offerings",
  {
    id: text("id").primaryKey(),
    businessContextId: text("business_context_id")
      .notNull()
      .references(() => businessContexts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("product"), // product | service
    description: text("description"),
    sourcePageUrl: text("source_page_url"), // provenance: which crawled page this came from
  },
  (table) => [index("business_offerings_context_idx").on(table.businessContextId)],
);

export const businessAudiences = pgTable(
  "business_audiences",
  {
    id: text("id").primaryKey(),
    businessContextId: text("business_context_id")
      .notNull()
      .references(() => businessContexts.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "SMB marketing teams"
    description: text("description"),
  },
  (table) => [index("business_audiences_context_idx").on(table.businessContextId)],
);

export const businessTermKindEnum = pgEnum("business_term_kind", ["glossary", "forbidden_claim"]);

/**
 * Terminology the business uses, and claims content generation must never make
 * (e.g. regulatory, legal, or competitive overreach). Forbidden claims are
 * enforced as hard constraints in AI generation, not suggestions.
 */
export const businessTerms = pgTable(
  "business_terms",
  {
    id: text("id").primaryKey(),
    businessContextId: text("business_context_id")
      .notNull()
      .references(() => businessContexts.id, { onDelete: "cascade" }),
    kind: businessTermKindEnum("kind").notNull(),
    term: text("term").notNull(),
    note: text("note"),
  },
  (table) => [index("business_terms_context_idx").on(table.businessContextId)],
);

export const businessCompetitors = pgTable(
  "business_competitors",
  {
    id: text("id").primaryKey(),
    businessContextId: text("business_context_id")
      .notNull()
      .references(() => businessContexts.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    note: text("note"),
  },
  (table) => [index("business_competitors_context_idx").on(table.businessContextId)],
);
