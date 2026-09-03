import Link from "next/link";
import { notFound } from "next/navigation";
import { FiAlertCircle, FiTarget, FiChevronRight, FiTrash2 } from "react-icons/fi";
import { requireOrg } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { listRecentJobsForWebsite } from "@/lib/jobs/job-queries";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { researchBudgetFor } from "@/lib/billing/entitlements";
import { describeBudget } from "@/lib/seo/research-budget";
import { formatRelativeTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteChip } from "@/components/ui/site-chip";
import { JobProgress } from "@/components/jobs/job-progress";
import { BusinessContextPanel } from "@/components/websites/business-context-panel";
import { RetryAnalysisButton } from "@/components/websites/retry-analysis-button";
import { StartResearchButton } from "@/components/websites/start-research-button";
import { DeleteWebsiteButton } from "@/components/websites/delete-website-button";

const STATUS_TONE = { pending: "neutral", analyzing: "accent", active: "ok", failed: "bad" } as const;

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const { organizationId } = await requireOrg();

  const website = await getWebsiteForOrg(organizationId, websiteId).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
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
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <SiteChip domain={website.domain} faviconUrl={website.faviconUrl} size="md" mono={false} />
          </div>
          <h1 className="text-display-l font-bold tracking-[-0.03em] text-ink">
            {website.siteName ?? website.domain}
          </h1>
          <p className="mono mt-1.5 text-[13px] text-ink-3">
            {latestAnalysis?.finishedAt
              ? `Last analyzed ${formatRelativeTime(latestAnalysis.finishedAt)}`
              : "Not analyzed yet"}
          </p>
        </div>
        <Badge tone={STATUS_TONE[website.status]}>{website.status}</Badge>
      </div>

      <div className="flex flex-col gap-6">
        {isAnalysisInFlight && (
          <Card className="p-6">
            <h2 className="eyebrow mb-4 text-ink-3">Bloggy is analyzing your website</h2>
            <JobProgress jobId={latestAnalysis.id} />
          </Card>
        )}

        {latestAnalysis?.status === "failed" && (
          <Card className="p-6">
            <p className="mb-3 flex items-center gap-1.5 text-[13.5px] text-bad">
              <FiAlertCircle size={14} />
              {latestAnalysis.errorMessage ?? "Analysis failed."}
            </p>
            <RetryAnalysisButton websiteId={websiteId} />
          </Card>
        )}

        {businessContext && (
          <Card className="p-6">
            <BusinessContextPanel websiteId={websiteId} details={businessContext} />
          </Card>
        )}

        {businessContext && !isAnalysisInFlight && (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-[14.5px] font-medium text-ink">
                  <FiTarget size={14} className="text-ink-3" />
                  Search opportunities
                </h2>
                {!isResearchInFlight && <p className="mt-1 text-[12.5px] text-ink-3">{describeBudget(budget)}</p>}
              </div>
              {!isResearchInFlight && <StartResearchButton websiteId={websiteId} />}
            </div>

            {isResearchInFlight && (
              <div className="mt-4">
                <JobProgress jobId={latestResearch.id} />
              </div>
            )}

            {latestResearch?.status === "succeeded" && !isResearchInFlight && (
              <Link
                href="/app/opportunities"
                className="mt-4 flex items-center gap-1 text-[13.5px] font-medium text-accent-ink hover:underline"
              >
                View opportunities
                <FiChevronRight size={13} />
              </Link>
            )}

            {latestResearch?.status === "failed" && (
              <p role="alert" className="mt-4 flex items-center gap-1.5 text-[13.5px] text-bad">
                <FiAlertCircle size={14} />
                {latestResearch.errorMessage}
              </p>
            )}
          </Card>
        )}

        {!businessContext && !isAnalysisInFlight && latestAnalysis?.status !== "failed" && (
          <Card className="p-6">
            <p className="text-[13.5px] text-ink-2">Analysis hasn&apos;t started yet.</p>
          </Card>
        )}

        <div className="mt-2 border-t border-line pt-6">
          <h2 className="eyebrow mb-3 text-bad">Danger zone</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="max-w-sm text-[13px] text-ink-3">
              Permanently deletes this website, its pages, opportunities, and articles.
            </p>
            <DeleteWebsiteButton
              websiteId={websiteId}
              domain={website.domain}
              icon={<FiTrash2 size={13} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
