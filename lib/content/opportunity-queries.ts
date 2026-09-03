import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { opportunities, websites, keywords } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";

export async function listOpportunitiesForOrg(organizationId: string) {
  return db
    .select({ opportunity: opportunities, website: websites, targetKeyword: keywords })
    .from(opportunities)
    .innerJoin(websites, eq(websites.id, opportunities.websiteId))
    .leftJoin(keywords, eq(keywords.id, opportunities.targetKeywordId))
    .where(eq(websites.organizationId, organizationId))
    .orderBy(desc(opportunities.score));
}

export async function getOpportunityForOrg(organizationId: string, opportunityId: string) {
  const [row] = await db
    .select({ opportunity: opportunities, website: websites })
    .from(opportunities)
    .innerJoin(websites, eq(websites.id, opportunities.websiteId))
    .where(and(eq(opportunities.id, opportunityId), eq(websites.organizationId, organizationId)))
    .limit(1);

  if (!row) throw new NotFoundError("Opportunity");
  return row;
}
