import "server-only";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  businessContexts,
  businessOfferings,
  businessAudiences,
  businessCompetitors,
} from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import type { DerivedBusinessContext } from "@/lib/ai/schemas/business-context";

/**
 * Inserts a new business-context version and flips it to current, leaving
 * prior versions intact for review/rollback. Never overwrites a user-edited
 * context implicitly — callers decide whether to re-derive.
 */
export async function saveDerivedBusinessContext(
  websiteId: string,
  derived: DerivedBusinessContext,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [{ current }] = await tx
      .select({ current: max(businessContexts.version) })
      .from(businessContexts)
      .where(eq(businessContexts.websiteId, websiteId));

    await tx
      .update(businessContexts)
      .set({ isCurrent: false })
      .where(and(eq(businessContexts.websiteId, websiteId), eq(businessContexts.isCurrent, true)));

    const contextId = createId("bctx");
    await tx.insert(businessContexts).values({
      id: contextId,
      websiteId,
      version: (current ?? 0) + 1,
      isCurrent: true,
      source: "derived",
      confidence: derived.confidence,
      summary: derived.summary,
      industries: derived.industries,
      locations: derived.locations,
      customerProblems: derived.customerProblems,
      useCases: derived.useCases,
      differentiators: derived.differentiators,
      brandVoice: derived.brandVoice,
      commercialPriorities: derived.commercialPriorities,
    });

    if (derived.offerings.length > 0) {
      await tx.insert(businessOfferings).values(
        derived.offerings.map((o) => ({
          id: createId("boff"),
          businessContextId: contextId,
          name: o.name,
          kind: o.kind,
          description: o.description,
        })),
      );
    }

    if (derived.audiences.length > 0) {
      await tx.insert(businessAudiences).values(
        derived.audiences.map((a) => ({
          id: createId("baud"),
          businessContextId: contextId,
          name: a.name,
          description: a.description,
        })),
      );
    }

    if (derived.competitors.length > 0) {
      await tx.insert(businessCompetitors).values(
        derived.competitors.map((domain) => ({
          id: createId("bcmp"),
          businessContextId: contextId,
          domain,
        })),
      );
    }

    return contextId;
  });
}
