"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCircle, FiGlobe } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import type { JobStepRecord } from "@/lib/jobs/types";

type JobPayload = {
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  steps: JobStepRecord[];
  errorMessage: string | null;
};

const POLL_INTERVAL_MS = 1500;

export function OnboardingAnalyzing({
  domain,
  jobId,
  onSucceeded,
  onFailed,
}: {
  domain: string;
  jobId: string;
  onSucceeded: () => void;
  onFailed: (message: string | null) => void;
}) {
  const [job, setJob] = useState<JobPayload | null>(null);
  const startedAt = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

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
          onSucceeded();
          return;
        }
        if (data.status === "failed") {
          onFailed(data.errorMessage);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks are stable per mount
  }, [jobId]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-paper-inset text-ink-3">
          <FiGlobe size={12} />
        </span>
        <span className="mono text-[13px] text-ink-2">{domain}</span>
      </div>

      <div className="flex flex-col gap-3.5" aria-live="polite">
        {(job?.steps ?? []).map((step) => (
          <div key={step.name} className="flex items-center gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {step.status === "succeeded" && <FiCheck className="text-ok" size={16} />}
              {step.status === "running" && <CgSpinner className="animate-spin text-accent" size={16} />}
              {step.status === "pending" && <FiCircle className="text-ink-3" size={8} />}
              {step.status === "failed" && <FiCircle className="text-bad" size={8} />}
            </span>
            <span className={`text-[14.5px] ${step.status === "pending" ? "text-ink-3" : "text-ink"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mono mt-6 text-[12px] text-ink-3">This usually takes under a minute · {elapsed}s</p>
    </div>
  );
}
