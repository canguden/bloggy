import { pgTable, text, timestamp, pgEnum, integer, jsonb, index } from "drizzle-orm/pg-core";
import { organizations } from "./org";
import { websites } from "./website";

export const jobKindEnum = pgEnum("job_kind", [
  "analyze_website",
  "research_keywords",
  "score_opportunities",
  "generate_brief",
  "generate_article",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);

/**
 * Checkpointed, leasable job record. `steps` holds named step results so a
 * resumed run can skip completed (and possibly paid) work. `leaseExpiresAt` is
 * heartbeated while running; a reaper reclaims jobs whose lease has expired —
 * `after()` is only a best-effort trigger, never a completion guarantee.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    websiteId: text("website_id").references(() => websites.id, { onDelete: "cascade" }),
    kind: jobKindEnum("kind").notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
    steps: jsonb("steps").notNull().default([]), // [{ name, status, startedAt, finishedAt }]
    cursor: jsonb("cursor"), // handler-defined resume point
    input: jsonb("input").notNull().default({}),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("jobs_org_idx").on(table.organizationId),
    index("jobs_website_idx").on(table.websiteId),
    index("jobs_status_idx").on(table.status),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actor: text("actor").notNull().default("bloggy"), // "user" | "bloggy"
    verb: text("verb").notNull(), // e.g. "analyzed_website", "found_opportunities"
    subjectType: text("subject_type"), // "website" | "opportunity" | "article" | ...
    subjectId: text("subject_id"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activity_events_org_idx").on(table.organizationId, table.createdAt)],
);
