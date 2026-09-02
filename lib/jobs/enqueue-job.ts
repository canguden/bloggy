import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db/client";
import { jobs, type jobKindEnum } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { runJob } from "./run-job";
import { reclaimStaleJobs } from "./reaper";
import { ensureJobHandlersRegistered } from "./register-handlers";

type JobKind = (typeof jobKindEnum.enumValues)[number];

/**
 * Inserts a queued job and triggers a run via `after()`. `after()` is a
 * best-effort trigger only — if the process dies before or during it, the
 * job simply sits `queued`/`running` with an expiring lease, and the reaper
 * (invoked wherever job status is read) picks it back up. No caller should
 * assume the job is done just because this function returned.
 */
export async function enqueueJob(params: {
  organizationId: string;
  websiteId?: string;
  kind: JobKind;
  input?: Record<string, unknown>;
}): Promise<string> {
  ensureJobHandlersRegistered();
  const id = createId("job");

  await db.insert(jobs).values({
    id,
    organizationId: params.organizationId,
    websiteId: params.websiteId,
    kind: params.kind,
    input: params.input ?? {},
  });

  after(async () => {
    await reclaimStaleJobs(params.organizationId);
    await runJob(id);
  });

  return id;
}
