import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { listRecentJobsForWebsite } from "@/lib/jobs/job-queries";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { researchBudgetFor } from "@/lib/billing/entitlements";
import { describeBudget } from "@/lib/seo/research-budget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobProgress } from "@/components/jobs/job-progress";
import { BusinessContextPanel } from "@/components/websites/business-context-panel";
import { RetryAnalysisButton } from "@/components/websites/retry-analysis-button";
import { StartResearchButton } from "@/components/websites/start-research-button";

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const { organizationId } = await requireOrg();

  const website = await getWebsiteForOrg(organizationId, websiteId);
  const jobs = await listRecentJobsForWebsite(organizationId, websiteId);
  const latestAnalysis = jobs.find((j) => j.kind === "analyze_website");
  const latestResearch = jobs.find((j) => j.kind === "research_keywords");
  const businessContext = await getCurrentBusinessContext(websiteId);
  const budget = await researchBudgetFor(organizationId);

  const isAnalysisInFlight =
    latestAnalysis && (latestAnalysis.status === "queued" || latestAnalysis.status === "running");
  const isResearchInFlight =
    latestResearch && (latestResearch.status === "queued" || latestResearch.status === "running");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
            {website.domain}
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{website.url}</p>
        </div>
        <Badge tone={website.status === "active" ? "success" : website.status === "failed" ? "danger" : "accent"}>
          {website.status}
        </Badge>
      </div>

      {isAnalysisInFlight && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-[var(--text-sm)] font-medium text-[var(--text-muted)]">
            Bloggy is analyzing your website
          </h2>
          <JobProgress jobId={latestAnalysis.id} />
        </Card>
      )}

      {latestAnalysis?.status === "failed" && (
        <Card className="mb-6 p-6">
          <p className="mb-3 text-[var(--text-sm)] text-[var(--danger)]">
            {latestAnalysis.errorMessage ?? "Analysis failed."}
          </p>
          <RetryAnalysisButton websiteId={websiteId} />
        </Card>
      )}

      {businessContext && (
        <Card className="mb-6 p-6">
          <BusinessContextPanel websiteId={websiteId} details={businessContext} />
        </Card>
      )}

      {businessContext && !isAnalysisInFlight && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="mb-1 text-[var(--text-sm)] font-medium text-[var(--text-primary)]">
                Search opportunities
              </h2>
              {!isResearchInFlight && (
                <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{describeBudget(budget)}</p>
              )}
            </div>
            {!isResearchInFlight && <StartResearchButton websiteId={websiteId} />}
          </div>

          {isResearchInFlight && (
            <div className="mt-4">
              <JobProgress jobId={latestResearch.id} />
            </div>
          )}

          {latestResearch?.status === "succeeded" && !isResearchInFlight && (
            <p className="mt-4 text-[var(--text-sm)] text-[var(--text-secondary)]">
              <Link href="/app/opportunities" className="font-medium text-[var(--accent)] hover:underline">
                View opportunities →
              </Link>
            </p>
          )}

          {latestResearch?.status === "failed" && (
            <p role="alert" className="mt-4 text-[var(--text-sm)] text-[var(--danger)]">
              {latestResearch.errorMessage}
            </p>
          )}
        </Card>
      )}

      {!businessContext && !isAnalysisInFlight && latestAnalysis?.status !== "failed" && (
        <Card className="p-6">
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            Analysis hasn&apos;t started yet.
          </p>
        </Card>
      )}
    </div>
  );
}
