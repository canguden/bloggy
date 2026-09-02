import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import type { JobContext, JobHandler, JobRow, JobStepRecord } from "./types";
import { claimJob, heartbeat, releaseLease } from "./lease";
import { AppError } from "@/lib/errors";

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(handler: JobHandler) {
  handlers.set(handler.kind, handler);
}

function initialSteps(handler: JobHandler): JobStepRecord[] {
  return handler.steps.map((s) => ({ name: s.name, label: s.label, status: "pending" as const }));
}

/**
 * Runs one attempt of a job. Safe to call on a job that's already partway
 * done (e.g. after a crash) — `checkpoint` skips steps recorded as complete
 * in the job's cursor. Safe to call concurrently — `claimJob` uses a
 * conditional update so only one caller wins the lease.
 */
export async function runJob(jobId: string): Promise<void> {
  const handler = await getHandlerForJob(jobId);
  if (!handler) return;

  const claimed = await claimJob(jobId, handler.steps.length ? initialSteps(handler) : undefined);
  if (!claimed) return; // already running elsewhere, or not claimable

  const job: JobRow = claimed;
  const cursor = (job.cursor as Record<string, unknown>) ?? {};

  const ctx: JobContext = {
    job,
    cursor,
    async setCursor(patch) {
      Object.assign(cursor, patch);
      await db.update(jobs).set({ cursor }).where(eq(jobs.id, jobId));
    },
    async checkpoint(name, label, fn) {
      const steps = (job.steps as JobStepRecord[]) ?? [];
      const step = steps.find((s) => s.name === name);

      if (cursor[`${name}__done`]) {
        return cursor[`${name}__result`] as Awaited<ReturnType<typeof fn>>;
      }

      if (step) {
        step.status = "running";
        step.startedAt = new Date().toISOString();
      }
      await db.update(jobs).set({ steps }).where(eq(jobs.id, jobId));

      try {
        const result = await fn();
        cursor[`${name}__done`] = true;
        cursor[`${name}__result`] = result;
        if (step) {
          step.status = "succeeded";
          step.finishedAt = new Date().toISOString();
        }
        await db.update(jobs).set({ steps, cursor }).where(eq(jobs.id, jobId));
        await heartbeat(jobId);
        return result;
      } catch (err) {
        if (step) step.status = "failed";
        await db.update(jobs).set({ steps }).where(eq(jobs.id, jobId));
        throw err;
      }
    },
  };

  try {
    await handler.run(ctx);
    await db
      .update(jobs)
      .set({ status: "succeeded", finishedAt: new Date(), leaseExpiresAt: null })
      .where(eq(jobs.id, jobId));
  } catch (err) {
    await handleJobFailure(job, err);
  }
}

async function handleJobFailure(job: JobRow, err: unknown) {
  const isFinalAttempt = job.attempts >= job.maxAttempts;
  const errorCode = err instanceof AppError ? err.code : "unexpected_error";
  const errorMessage = err instanceof AppError ? err.message : "An unexpected error occurred";

  console.error(`Job ${job.id} (${job.kind}) failed on attempt ${job.attempts}`, err);

  if (isFinalAttempt) {
    await db
      .update(jobs)
      .set({ status: "failed", finishedAt: new Date(), leaseExpiresAt: null, errorCode, errorMessage })
      .where(eq(jobs.id, job.id));
  } else {
    // Leave it queued for another attempt (triggered by the reaper or the
    // next time the caller polls) rather than burning the final attempt now.
    await releaseLease(job.id, { errorCode, errorMessage });
  }
}

async function getHandlerForJob(jobId: string): Promise<JobHandler | undefined> {
  const [row] = await db.select({ kind: jobs.kind }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return row ? handlers.get(row.kind) : undefined;
}
