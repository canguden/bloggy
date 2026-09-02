"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth/session";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { db } from "@/lib/db/client";
import {
  businessContexts,
  businessOfferings,
  businessAudiences,
  businessTerms,
  businessCompetitors,
} from "@/lib/db/schema";
import { and, eq, max } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { toUserMessage } from "@/lib/errors";
import { z } from "zod";

const updateSchema = z.object({
  websiteId: z.string(),
  summary: z.string().min(1, "Summary can't be empty").max(2000),
  brandVoice: z.string().max(200).optional(),
  differentiators: z.string().max(2000).optional(), // newline-separated in the form
});

function splitLines(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * A user correction always creates a new current version (source=user_edited)
 * rather than mutating in place — a regeneration later is reviewable, not
 * destructive. Locations/industries/etc. carry over unchanged from the prior
 * version; this form only exposes the fields most worth hand-correcting.
 */
export async function updateBusinessContextAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    const parsed = updateSchema.parse({
      websiteId: formData.get("websiteId"),
      summary: formData.get("summary"),
      brandVoice: formData.get("brandVoice") || undefined,
      differentiators: formData.get("differentiators") || undefined,
    });

    await getWebsiteForOrg(organizationId, parsed.websiteId); // authorization check

    const [previous] = await db
      .select()
      .from(businessContexts)
      .where(and(eq(businessContexts.websiteId, parsed.websiteId), eq(businessContexts.isCurrent, true)))
      .limit(1);

    const [{ current }] = await db
      .select({ current: max(businessContexts.version) })
      .from(businessContexts)
      .where(eq(businessContexts.websiteId, parsed.websiteId));

    await db.transaction(async (tx) => {
      await tx
        .update(businessContexts)
        .set({ isCurrent: false })
        .where(and(eq(businessContexts.websiteId, parsed.websiteId), eq(businessContexts.isCurrent, true)));

      const newContextId = createId("bctx");
      await tx.insert(businessContexts).values({
        id: newContextId,
        websiteId: parsed.websiteId,
        version: (current ?? 0) + 1,
        isCurrent: true,
        source: "user_edited",
        confidence: null,
        summary: parsed.summary,
        brandVoice: parsed.brandVoice ?? previous?.brandVoice ?? null,
        differentiators: parsed.differentiators ? splitLines(parsed.differentiators) : previous?.differentiators ?? [],
        industries: previous?.industries ?? [],
        locations: previous?.locations ?? [],
        customerProblems: previous?.customerProblems ?? [],
        useCases: previous?.useCases ?? [],
        commercialPriorities: previous?.commercialPriorities ?? [],
      });

      // A correction only touches the fields exposed in this form — the
      // structured child rows (offerings, audiences, terms, competitors)
      // carry over unchanged onto the new version.
      if (previous) {
        const [offerings, audiences, terms, competitors] = await Promise.all([
          tx.select().from(businessOfferings).where(eq(businessOfferings.businessContextId, previous.id)),
          tx.select().from(businessAudiences).where(eq(businessAudiences.businessContextId, previous.id)),
          tx.select().from(businessTerms).where(eq(businessTerms.businessContextId, previous.id)),
          tx.select().from(businessCompetitors).where(eq(businessCompetitors.businessContextId, previous.id)),
        ]);

        if (offerings.length > 0) {
          await tx.insert(businessOfferings).values(
            offerings.map((o) => ({ ...o, id: createId("boff"), businessContextId: newContextId })),
          );
        }
        if (audiences.length > 0) {
          await tx.insert(businessAudiences).values(
            audiences.map((a) => ({ ...a, id: createId("baud"), businessContextId: newContextId })),
          );
        }
        if (terms.length > 0) {
          await tx.insert(businessTerms).values(
            terms.map((t) => ({ ...t, id: createId("bterm"), businessContextId: newContextId })),
          );
        }
        if (competitors.length > 0) {
          await tx.insert(businessCompetitors).values(
            competitors.map((c) => ({ ...c, id: createId("bcmp"), businessContextId: newContextId })),
          );
        }
      }
    });

    revalidatePath(`/app/websites/${parsed.websiteId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}
