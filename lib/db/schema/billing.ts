import { pgTable, text, timestamp, pgEnum, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { organizations } from "./org";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: text("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subscriptions_org_idx").on(table.organizationId)],
);

/** One row per org+metric+billing-period, incremented atomically. */
export const usageCounters = pgTable(
  "usage_counters",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(), // "articles_generated" | "keyword_research_units" | ...
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("usage_counters_org_metric_period_unique").on(
      table.organizationId,
      table.metric,
      table.periodStart,
    ),
  ],
);
