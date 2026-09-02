CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."website_status" AS ENUM('pending', 'analyzing', 'active', 'failed');--> statement-breakpoint
CREATE TYPE "public"."business_context_source" AS ENUM('derived', 'user_edited');--> statement-breakpoint
CREATE TYPE "public"."business_term_kind" AS ENUM('glossary', 'forbidden_claim');--> statement-breakpoint
CREATE TYPE "public"."keyword_source" AS ENUM('dataforseo', 'manual');--> statement-breakpoint
CREATE TYPE "public"."search_intent" AS ENUM('informational', 'commercial', 'transactional', 'navigational');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'review', 'ready', 'published', 'updating', 'archived', 'failed');--> statement-breakpoint
CREATE TYPE "public"."content_format" AS ENUM('how_to', 'listicle', 'comparison', 'guide', 'landing');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('new', 'planned', 'in_progress', 'done', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."job_kind" AS ENUM('analyze_website', 'research_keywords', 'score_opportunities', 'generate_brief', 'generate_article');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "website_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"website_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"h1" text,
	"summary" text,
	"is_indexable" boolean DEFAULT true NOT NULL,
	"content_hash" text NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"status" "website_status" DEFAULT 'pending' NOT NULL,
	"last_analyzed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_audiences" (
	"id" text PRIMARY KEY NOT NULL,
	"business_context_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "business_competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"business_context_id" text NOT NULL,
	"domain" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "business_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"website_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"source" "business_context_source" DEFAULT 'derived' NOT NULL,
	"confidence" real,
	"summary" text NOT NULL,
	"industries" text[] DEFAULT '{}' NOT NULL,
	"locations" text[] DEFAULT '{}' NOT NULL,
	"customer_problems" text[] DEFAULT '{}' NOT NULL,
	"use_cases" text[] DEFAULT '{}' NOT NULL,
	"differentiators" text[] DEFAULT '{}' NOT NULL,
	"brand_voice" text,
	"commercial_priorities" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_offerings" (
	"id" text PRIMARY KEY NOT NULL,
	"business_context_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'product' NOT NULL,
	"description" text,
	"source_page_url" text
);
--> statement-breakpoint
CREATE TABLE "business_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"business_context_id" text NOT NULL,
	"kind" "business_term_kind" NOT NULL,
	"term" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"website_id" text NOT NULL,
	"domain" text NOT NULL,
	"discovered_from" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" text PRIMARY KEY NOT NULL,
	"website_id" text NOT NULL,
	"keyword" text NOT NULL,
	"volume" integer,
	"difficulty" real,
	"cpc" real,
	"intent" "search_intent",
	"source" "keyword_source" DEFAULT 'dataforseo' NOT NULL,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb NOT NULL,
	"cost_units" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"keyword_id" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"results" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_by" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"website_id" text NOT NULL,
	"opportunity_id" text,
	"brief_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"meta_description" text,
	"format" text DEFAULT 'markdown' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"angle" text NOT NULL,
	"outline" jsonb NOT NULL,
	"target_word_count" integer,
	"internal_link_targets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"competitor_urls" text[] DEFAULT '{}' NOT NULL,
	"content_gap" text,
	"cta" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"website_id" text NOT NULL,
	"title" text NOT NULL,
	"target_keyword_id" text,
	"related_keywords" text[] DEFAULT '{}' NOT NULL,
	"intent" "search_intent",
	"format" "content_format" DEFAULT 'guide' NOT NULL,
	"score" integer NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"rationale" text,
	"status" "opportunity_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor" text DEFAULT 'bloggy' NOT NULL,
	"verb" text NOT NULL,
	"subject_type" text,
	"subject_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"website_id" text,
	"kind" "job_kind" NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cursor" jsonb,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"metric" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_pages" ADD CONSTRAINT "website_pages_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_audiences" ADD CONSTRAINT "business_audiences_business_context_id_business_contexts_id_fk" FOREIGN KEY ("business_context_id") REFERENCES "public"."business_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_competitors" ADD CONSTRAINT "business_competitors_business_context_id_business_contexts_id_fk" FOREIGN KEY ("business_context_id") REFERENCES "public"."business_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_contexts" ADD CONSTRAINT "business_contexts_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_offerings" ADD CONSTRAINT "business_offerings_business_context_id_business_contexts_id_fk" FOREIGN KEY ("business_context_id") REFERENCES "public"."business_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_terms" ADD CONSTRAINT "business_terms_business_context_id_business_contexts_id_fk" FOREIGN KEY ("business_context_id") REFERENCES "public"."business_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_snapshots" ADD CONSTRAINT "serp_snapshots_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_brief_id_content_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."content_briefs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_target_keyword_id_keywords_id_fk" FOREIGN KEY ("target_keyword_id") REFERENCES "public"."keywords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_unique" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "website_pages_website_url_unique" ON "website_pages" USING btree ("website_id","url");--> statement-breakpoint
CREATE INDEX "website_pages_website_idx" ON "website_pages" USING btree ("website_id");--> statement-breakpoint
CREATE UNIQUE INDEX "websites_org_domain_unique" ON "websites" USING btree ("organization_id","domain");--> statement-breakpoint
CREATE INDEX "websites_org_idx" ON "websites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "business_audiences_context_idx" ON "business_audiences" USING btree ("business_context_id");--> statement-breakpoint
CREATE INDEX "business_competitors_context_idx" ON "business_competitors" USING btree ("business_context_id");--> statement-breakpoint
CREATE INDEX "business_contexts_website_idx" ON "business_contexts" USING btree ("website_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_contexts_website_current_unique" ON "business_contexts" USING btree ("website_id") WHERE "business_contexts"."is_current" = true;--> statement-breakpoint
CREATE INDEX "business_offerings_context_idx" ON "business_offerings" USING btree ("business_context_id");--> statement-breakpoint
CREATE INDEX "business_terms_context_idx" ON "business_terms" USING btree ("business_context_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competitors_website_domain_unique" ON "competitors" USING btree ("website_id","domain");--> statement-breakpoint
CREATE INDEX "competitors_website_idx" ON "competitors" USING btree ("website_id");--> statement-breakpoint
CREATE UNIQUE INDEX "keywords_website_keyword_unique" ON "keywords" USING btree ("website_id","keyword");--> statement-breakpoint
CREATE INDEX "keywords_website_idx" ON "keywords" USING btree ("website_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_cache_request_hash_unique" ON "provider_cache" USING btree ("request_hash");--> statement-breakpoint
CREATE INDEX "provider_cache_expires_idx" ON "provider_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "serp_snapshots_keyword_idx" ON "serp_snapshots" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "article_versions_article_idx" ON "article_versions" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_website_slug_unique" ON "articles" USING btree ("website_id","slug");--> statement-breakpoint
CREATE INDEX "articles_org_idx" ON "articles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "articles_website_status_idx" ON "articles" USING btree ("website_id","status");--> statement-breakpoint
CREATE INDEX "content_briefs_opportunity_idx" ON "content_briefs" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "opportunities_website_idx" ON "opportunities" USING btree ("website_id");--> statement-breakpoint
CREATE INDEX "opportunities_website_status_idx" ON "opportunities" USING btree ("website_id","status");--> statement-breakpoint
CREATE INDEX "activity_events_org_idx" ON "activity_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "jobs_org_idx" ON "jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "jobs_website_idx" ON "jobs" USING btree ("website_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_org_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_counters_org_metric_period_unique" ON "usage_counters" USING btree ("organization_id","metric","period_start");