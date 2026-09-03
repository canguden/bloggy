"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiGlobe } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addWebsiteAction } from "@/lib/websites/website-actions";
import { normalizeWebsiteUrl } from "@/lib/websites/normalize-url";
import { OnboardingAnalyzing } from "./onboarding-analyzing";
import { OnboardingReview } from "./onboarding-review";

type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const router = useRouter();
  const { show } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const domain = useMemo(() => {
    if (!url.trim()) return null;
    try {
      return normalizeWebsiteUrl(url).domain;
    } catch {
      return null;
    }
  }, [url]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData();
    formData.set("url", url);
    const result = await addWebsiteAction(undefined, formData);
    setSubmitting(false);

    if (result.success) {
      setWebsiteId(result.websiteId);
      setJobId(result.jobId);
      setStep(2);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-[3px] w-10 rounded-full transition-colors duration-[var(--dur-color)] ${
                s <= step ? "bg-ink" : "bg-line"
              }`}
            />
          ))}
        </div>
        <span className="mono text-[12px] text-ink-3">Step {step} of 3</span>
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink">
            What&apos;s your website?
          </h1>
          <p className="mt-2 mb-6 text-[13.5px] text-ink-2">Bloggy reads it to learn what you sell.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[4px] bg-paper-inset">
                {domain ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <FiGlobe size={11} className="text-ink-3" />
                )}
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                autoFocus
                required
                className={`h-12 w-full rounded-[var(--radius-sm)] border bg-paper pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors duration-[var(--dur-color)] ${
                  error ? "border-bad" : "border-line-2 focus:border-ink"
                }`}
              />
            </div>
            {error && <p className="text-[12.5px] text-bad">{error}</p>}
            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Analyze website
            </Button>
          </form>
        </div>
      )}

      {step === 2 && websiteId && jobId && (
        <OnboardingAnalyzing
          domain={domain ?? ""}
          jobId={jobId}
          onSucceeded={() => setStep(3)}
          onFailed={(message) => {
            show(message ?? "Couldn't analyze your website", { variant: "error" });
            router.push(`/app/websites/${websiteId}`);
          }}
        />
      )}

      {step === 3 && websiteId && (
        <OnboardingReview
          websiteId={websiteId}
          onDone={() => {
            show("You're all set", { variant: "success" });
            router.push("/app");
          }}
        />
      )}
    </div>
  );
}
