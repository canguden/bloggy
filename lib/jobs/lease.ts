import "server-only";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import type { JobRow, JobStepRecord } from "./types";

export const LEASE_DURATION_MS = 90_000;

/**
 * Atomically claims a job for execution: only succeeds if the job is
 * `queued`, or `running` with an expired lease (meaning a previous runner
 * died mid-execution). The WHERE clause is the concurrency control — two
 * callers racing to claim the same job only ever produce one winner, because
 * the losing UPDATE affects zero rows.
 */
export async function claimJob(jobId: string, initialSteps?: JobStepRecord[]): Promise<JobRow | null> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

  const [claimed] = await db
    .update(jobs)
    .set({
      status: "running",
      leaseExpiresAt,
      startedAt: sql`coalesce(${jobs.startedAt}, ${now})`,
      attempts: sql`${jobs.attempts} + 1`,
      errorCode: null,
      errorMessage: null,
    })
    .where(
      and(
        eq(jobs.id, jobId),
        or(
          eq(jobs.status, "queued"),
          and(eq(jobs.status, "running"), or(isNull(jobs.leaseExpiresAt), lt(jobs.leaseExpiresAt, now))),
        ),
      ),
    )
    .returning();

  if (!claimed) return null;

  // First-ever claim: seed the declared step list so the UI can show all
  // named steps immediately, before any of them have run.
  if (initialSteps && Array.isArray(claimed.steps) && claimed.steps.length === 0) {
    claimed.steps = initialSteps;
    await db.update(jobs).set({ steps: initialSteps }).where(eq(jobs.id, jobId));
  }

  return claimed;
}

export async function heartbeat(jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({ leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS) })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "running")));
}

/** Returns a job to `queued` after a non-final failed attempt, clearing the lease. */
export async function releaseLease(
  jobId: string,
  info: { errorCode: string; errorMessage: string },
): Promise<void> {
  await db
    .update(jobs)
    .set({ status: "queued", leaseExpiresAt: null, errorCode: info.errorCode, errorMessage: info.errorMessage })
    .where(eq(jobs.id, jobId));
}
