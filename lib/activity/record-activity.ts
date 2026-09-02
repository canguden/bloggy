import "server-only";
import { db } from "@/lib/db/client";
import { activityEvents } from "@/lib/db/schema";
import { createId } from "@/lib/ids";

export async function recordActivity(params: {
  organizationId: string;
  actor?: "user" | "bloggy";
  verb: string;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(activityEvents).values({
    id: createId("evt"),
    organizationId: params.organizationId,
    actor: params.actor ?? "bloggy",
    verb: params.verb,
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    payload: params.payload ?? {},
  });
}
