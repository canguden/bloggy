import { pgTable, text, timestamp, pgEnum, uniqueIndex, index, boolean } from "drizzle-orm/pg-core";
import { organizations } from "./org";

export const websiteStatusEnum = pgEnum("website_status", [
  "pending", // added, not yet analyzed
  "analyzing",
  "active", // analyzed at least once
  "failed",
]);

export const websites = pgTable(
  "websites",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    status: websiteStatusEnum("status").notNull().default("pending"),
    faviconUrl: text("favicon_url"),
    siteName: text("site_name"),
    lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("websites_org_domain_unique").on(table.organizationId, table.domain),
    index("websites_org_idx").on(table.organizationId),
  ],
);

export const websitePages = pgTable(
  "website_pages",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    h1: text("h1"),
    summary: text("summary"),
    isIndexable: boolean("is_indexable").notNull().default(true),
    contentHash: text("content_hash").notNull(),
    crawledAt: timestamp("crawled_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("website_pages_website_url_unique").on(table.websiteId, table.url),
    index("website_pages_website_idx").on(table.websiteId),
  ],
);
