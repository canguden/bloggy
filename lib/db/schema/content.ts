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
import { organizations } from "./org";
import { websites } from "./website";
import { keywords, searchIntentEnum } from "./seo";
import { users } from "./auth";

export const contentFormatEnum = pgEnum("content_format", [
  "how_to",
  "listicle",
  "comparison",
  "guide",
  "landing",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "new",
  "planned",
  "in_progress",
  "done",
  "dismissed",
]);

/**
 * `score` and `scoreBreakdown` are produced by the deterministic scorer
 * (lib/content/opportunity-score.ts) — AI never sets them. `rationale` is AI
 * prose explaining the breakdown, generated after scoring, never before.
 */
export const opportunities = pgTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetKeywordId: text("target_keyword_id").references(() => keywords.id, {
      onDelete: "set null",
    }),
    relatedKeywords: text("related_keywords").array().notNull().default([]),
    intent: searchIntentEnum("intent"),
    format: contentFormatEnum("format").notNull().default("guide"),
    score: integer("score").notNull(), // 0-100, deterministic
    scoreBreakdown: jsonb("score_breakdown").notNull(), // { searchDemand, competition, businessRelevance, commercialIntent, contentGap }
    rationale: text("rationale"), // AI-written explanation of the breakdown
    status: opportunityStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("opportunities_website_idx").on(table.websiteId),
    index("opportunities_website_status_idx").on(table.websiteId, table.status),
  ],
);

export const contentBriefs = pgTable(
  "content_briefs",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    angle: text("angle").notNull(),
    outline: jsonb("outline").notNull(), // [{ heading, level, notes }]
    targetWordCount: integer("target_word_count"),
    internalLinkTargets: jsonb("internal_link_targets").notNull().default([]), // [{ pageId, url, anchor }]
    competitorUrls: text("competitor_urls").array().notNull().default([]),
    contentGap: text("content_gap"),
    cta: text("cta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("content_briefs_opportunity_idx").on(table.opportunityId)],
);

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "review",
  "ready", // approved, awaiting a real publish integration
  "published", // set only by a publishing-provider, never by "mark as ready"
  "updating",
  "archived",
  "failed",
]);

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    opportunityId: text("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    briefId: text("brief_id").references(() => contentBriefs.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    metaDescription: text("meta_description"),
    format: text("format").notNull().default("markdown"), // discriminator for article-body.ts
    body: text("body").notNull().default(""),
    status: articleStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_website_slug_unique").on(table.websiteId, table.slug),
    index("articles_org_idx").on(table.organizationId),
    index("articles_website_status_idx").on(table.websiteId, table.status),
  ],
);

export const articleVersions = pgTable(
  "article_versions",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    contentHash: text("content_hash").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }), // null = system-generated
    reason: text("reason").notNull(), // "generated" | "edit" | "status_change" | ...
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("article_versions_article_idx").on(table.articleId)],
);
