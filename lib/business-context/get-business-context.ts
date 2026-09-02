import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  businessContexts,
  businessOfferings,
  businessAudiences,
  businessTerms,
  businessCompetitors,
} from "@/lib/db/schema";

export type BusinessContextWithDetails = Awaited<ReturnType<typeof getCurrentBusinessContext>>;

export async function getCurrentBusinessContext(websiteId: string) {
  const [context] = await db
    .select()
    .from(businessContexts)
    .where(and(eq(businessContexts.websiteId, websiteId), eq(businessContexts.isCurrent, true)))
    .limit(1);

  if (!context) return null;

  const [offerings, audiences, terms, competitors] = await Promise.all([
    db.select().from(businessOfferings).where(eq(businessOfferings.businessContextId, context.id)),
    db.select().from(businessAudiences).where(eq(businessAudiences.businessContextId, context.id)),
    db.select().from(businessTerms).where(eq(businessTerms.businessContextId, context.id)),
    db.select().from(businessCompetitors).where(eq(businessCompetitors.businessContextId, context.id)),
  ]);

  return { context, offerings, audiences, terms, competitors };
}
