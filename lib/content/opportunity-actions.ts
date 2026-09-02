"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { opportunities } from "@/lib/db/schema";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { enqueueJob } from "@/lib/jobs/enqueue-job";
import { ValidationError, toUserMessage } from "@/lib/errors";
import { getOpportunityForOrg } from "./opportunity-queries";

export async function startResearchAction(websiteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    await getWebsiteForOrg(organizationId, websiteId); // authorization check

    const businessContext = await getCurrentBusinessContext(websiteId);
    if (!businessContext) {
      throw new ValidationError("Bloggy needs to understand your business before it can research keywords");
    }

    await enqueueJob({ organizationId, websiteId, kind: "research_keywords" });
    revalidatePath(`/app/websites/${websiteId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}

export async function dismissOpportunityAction(opportunityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    await getOpportunityForOrg(organizationId, opportunityId); // authorization check
    await db.update(opportunities).set({ status: "dismissed" }).where(eq(opportunities.id, opportunityId));
    revalidatePath("/app/opportunities");
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}
