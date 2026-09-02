import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { websites, websitePages } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";

/**
 * Every tenant-scoped read/write goes through functions here, which always
 * filter by organizationId. No caller composes its own `where` clause on
 * `websites` directly — this is the authorization boundary, not the UI.
 */
export async function listWebsitesForOrg(organizationId: string) {
  return db
    .select()
    .from(websites)
    .where(eq(websites.organizationId, organizationId))
    .orderBy(desc(websites.createdAt));
}

export async function getWebsiteForOrg(organizationId: string, websiteId: string) {
  const [website] = await db
    .select()
    .from(websites)
    .where(and(eq(websites.id, websiteId), eq(websites.organizationId, organizationId)))
    .limit(1);

  if (!website) throw new NotFoundError("Website");
  return website;
}

export async function listWebsitePages(websiteId: string) {
  return db.select().from(websitePages).where(eq(websitePages.websiteId, websiteId));
}
