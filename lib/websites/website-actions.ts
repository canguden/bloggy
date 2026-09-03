"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { websites } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { normalizeWebsiteUrl } from "./normalize-url";
import { addWebsiteSchema } from "@/lib/validation/website";
import { enqueueJob } from "@/lib/jobs/enqueue-job";
import { getWebsiteForOrg } from "./website-queries";
import { ValidationError, toUserMessage } from "@/lib/errors";

export type AddWebsiteResult =
  | { success: true; websiteId: string }
  | { success: false; error: string };

export async function addWebsiteAction(_prev: unknown, formData: FormData): Promise<AddWebsiteResult> {
  try {
    const { organizationId } = await requireOrg();
    const parsed = addWebsiteSchema.safeParse({ url: formData.get("url") });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Enter a valid URL" };
    }

    const { url, domain } = normalizeWebsiteUrl(parsed.data.url);

    const existing = await db.query.websites.findFirst({
      where: (w, { and, eq }) => and(eq(w.organizationId, organizationId), eq(w.domain, domain)),
    });
    if (existing) {
      throw new ValidationError("This website is already in your workspace");
    }

    const websiteId = createId("web");
    await db.insert(websites).values({ id: websiteId, organizationId, url, domain });

    await enqueueJob({ organizationId, websiteId, kind: "analyze_website" });

    revalidatePath("/app/websites");
    return { success: true, websiteId };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}

export async function retryAnalysisAction(websiteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    await getWebsiteForOrg(organizationId, websiteId); // authorization check
    await db.update(websites).set({ status: "pending" }).where(eq(websites.id, websiteId));
    await enqueueJob({ organizationId, websiteId, kind: "analyze_website" });
    revalidatePath(`/app/websites/${websiteId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}

export async function deleteWebsiteAction(websiteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await requireOrg();
    await getWebsiteForOrg(organizationId, websiteId); // authorization check
    await db.delete(websites).where(eq(websites.id, websiteId)); // cascades: pages, keywords, opportunities, articles, jobs
    revalidatePath("/app/websites");
    return { success: true };
  } catch (err) {
    return { success: false, error: toUserMessage(err) };
  }
}
