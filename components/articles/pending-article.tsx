"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { JobProgress } from "@/components/jobs/job-progress";

export function PendingArticle({ jobId }: { jobId: string }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="p-8">
        <h1 className="mb-1 font-serif text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">
          Writing your article
        </h1>
        <p className="mb-6 text-[var(--text-sm)] text-[var(--text-secondary)]">
          Bloggy is researching an angle and drafting the article. This usually takes under a minute.
        </p>
        <JobProgress
          jobId={jobId}
          onSucceeded={(job) => {
            if (job.articleId) router.replace(`/app/articles/${job.articleId}`);
          }}
        />
      </Card>
    </div>
  );
}
