"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiLoader, FiAlertCircle } from "react-icons/fi";
import type { JobStepRecord } from "@/lib/jobs/types";

type JobPayload = {
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  steps: JobStepRecord[];
  errorMessage: string | null;
  articleId?: string;
};

const POLL_INTERVAL_MS = 2000;

export function JobProgress({ jobId, onSucceeded }: { jobId: string; onSucceeded?: (job: JobPayload) => void }) {
  const router = useRouter();
  const [job, setJob] = useState<JobPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        const data: JobPayload = await res.json();
        if (cancelled) return;
        setJob(data);

        if (data.status === "succeeded") {
          onSucceeded?.(data);
          router.refresh();
          return;
        }
        if (data.status === "failed") {
          router.refresh();
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSucceeded is expected to be stable per mount
  }, [jobId, router]);

  if (!job) {
    return <p className="text-[var(--text-sm)] text-[var(--text-muted)]">Checking status…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {job.steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center">
            {step.status === "succeeded" && <FiCheck className="text-[var(--success)]" size={16} />}
            {step.status === "running" && (
              <FiLoader className="animate-spin text-[var(--accent)]" size={16} />
            )}
            {step.status === "failed" && <FiAlertCircle className="text-[var(--danger)]" size={16} />}
            {step.status === "pending" && (
              <span className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
            )}
          </span>
          <span
            className={`text-[var(--text-sm)] ${
              step.status === "pending" ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
      {job.status === "failed" && job.errorMessage && (
        <p role="alert" className="mt-1 text-[var(--text-sm)] text-[var(--danger)]">
          {job.errorMessage}
        </p>
      )}
    </div>
  );
}
