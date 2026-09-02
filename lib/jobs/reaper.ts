import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { runJob } from "./run-job";
import { ensureJobHandlersRegistered } from "./register-handlers";

/**
 * Finds jobs stuck `running` with an expired lease (their runner crashed,
 * the deploy restarted, `after()` never fired, ...) and gives them back to
 * `runJob`, which resumes from their checkpointed cursor rather than
 * starting over. Called whenever job status is read (job-list pages, the
 * status-polling endpoint) and before enqueuing a new job — there is no
 * separate worker process in this implementation, so reads double as the
 * recovery trigger.
 */
export async function reclaimStaleJobs(organizationId: string): Promise<void> {
  ensureJobHandlersRegistered();
  const now = new Date();

  const stale = await db
    .update(jobs)
    .set({ status: "queued", leaseExpiresAt: null })
    .where(and(eq(jobs.organizationId, organizationId), eq(jobs.status, "running"), lt(jobs.leaseExpiresAt, now)))
    .returning({ id: jobs.id });

  for (const { id } of stale) {
    await runJob(id);
  }

  // Attempts exhausted while stuck running (rather than via a caught error)
  // still need to land in `failed`, not loop forever between queued/running.
  await db
    .update(jobs)
    .set({
      status: "failed",
      errorCode: "lease_exhausted",
      errorMessage: "This step kept failing to complete. Please try again.",
      finishedAt: now,
    })
    .where(
      and(
        eq(jobs.organizationId, organizationId),
        eq(jobs.status, "queued"),
        sql`${jobs.attempts} >= ${jobs.maxAttempts}`,
      ),
    );
}
