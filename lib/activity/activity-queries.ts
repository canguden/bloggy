import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { activityEvents } from "@/lib/db/schema";

export async function listRecentActivity(organizationId: string, limit = 30) {
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.organizationId, organizationId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);
}
