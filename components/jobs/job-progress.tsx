"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiAlertCircle, FiCircle } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
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
    return (
      <div className="flex items-center gap-2 text-[13px] text-ink-3">
        <CgSpinner className="animate-spin" size={14} />
        Checking status…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {job.steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            {step.status === "succeeded" && <FiCheck className="text-ok" size={16} />}
            {step.status === "running" && <CgSpinner className="animate-spin text-accent" size={16} />}
            {step.status === "failed" && <FiAlertCircle className="text-bad" size={16} />}
            {step.status === "pending" && <FiCircle className="text-ink-3" size={8} />}
          </span>
          <span className={`text-[13.5px] ${step.status === "pending" ? "text-ink-3" : "text-ink"}`}>
            {step.label}
          </span>
        </div>
      ))}
      {job.status === "failed" && job.errorMessage && (
        <p role="alert" className="mt-1 flex items-center gap-1.5 text-[13px] text-bad">
          <FiAlertCircle size={13} />
          {job.errorMessage}
        </p>
      )}
    </div>
  );
}
