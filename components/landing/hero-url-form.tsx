"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiGlobe, FiArrowUpRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { normalizeWebsiteUrl } from "@/lib/websites/normalize-url";
import { addWebsiteAction } from "@/lib/websites/website-actions";
import { PENDING_URL_KEY } from "@/lib/onboarding/pending-url";

/**
 * Lets a visitor start with the one thing that matters — their URL — before
 * they've even signed up. Signed-out visitors get the URL carried through
 * signup/login (see PENDING_URL_KEY) and land straight in analysis; a
 * signed-in visitor skips the account step entirely.
 */
export function HeroUrlForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!hasSession) {
      try {
        sessionStorage.setItem(PENDING_URL_KEY, url);
      } catch {
        // sessionStorage unavailable (private mode, etc.) — signup still works, just re-prompts for the URL
      }
      router.push("/signup");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("url", url);
    const result = await addWebsiteAction(undefined, formData);
    setSubmitting(false);

    if (result.success) {
      router.push(`/onboarding?websiteId=${result.websiteId}&jobId=${result.jobId}`);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-start">
      <div className="relative flex-1">
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
          placeholder="yourwebsite.com"
          required
          className={`h-12 w-full rounded-full border bg-paper pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors duration-[var(--dur-color)] ${
            error ? "border-bad" : "border-line-2 focus:border-ink"
          }`}
        />
      </div>
      <Button type="submit" size="lg" loading={submitting} className="hover-ring shrink-0" iconRight={<FiArrowUpRight size={16} />}>
        Analyze
      </Button>
      {error && <p className="text-[12.5px] text-bad sm:basis-full">{error}</p>}
    </form>
  );
}
