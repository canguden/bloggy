import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import { reclaimStaleJobs } from "./reaper";

/** Always reclaims stale (expired-lease) jobs before reading — reads double as the recovery trigger. */
export async function getJobForOrg(organizationId: string, jobId: string) {
  await reclaimStaleJobs(organizationId);

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId)))
    .limit(1);

  if (!job) throw new NotFoundError("Job");
  return job;
}

export async function listRecentJobsForWebsite(organizationId: string, websiteId: string) {
  await reclaimStaleJobs(organizationId);

  return db
    .select()
    .from(jobs)
    .where(and(eq(jobs.organizationId, organizationId), eq(jobs.websiteId, websiteId)))
    .orderBy(desc(jobs.createdAt))
    .limit(20);
}
