import type { jobs } from "@/lib/db/schema";

export type JobRow = typeof jobs.$inferSelect;

export type JobStepStatus = "pending" | "running" | "succeeded" | "failed";

export type JobStepRecord = {
  name: string;
  label: string; // human-readable, shown in the UI ("Reading your site")
  status: JobStepStatus;
  startedAt?: string;
  finishedAt?: string;
};

/**
 * Handler context passed to each job kind's `run`. `checkpoint` is the
 * idempotency primitive: a step already marked succeeded (from a prior,
 * interrupted attempt) is skipped rather than re-executed — which is what
 * keeps a resumed job from re-buying DataForSEO calls or re-crawling pages.
 */
export type JobContext = {
  job: JobRow;
  /** Arbitrary resume data written by a previous attempt (handler-defined shape). */
  cursor: Record<string, unknown>;
  checkpoint: <T>(name: string, label: string, fn: () => Promise<T>) => Promise<T | undefined>;
  setCursor: (patch: Record<string, unknown>) => Promise<void>;
};

export type JobHandler = {
  kind: string;
  steps: Array<{ name: string; label: string }>; // declared up front so the UI can show all steps immediately
  run: (ctx: JobContext) => Promise<void>;
};
