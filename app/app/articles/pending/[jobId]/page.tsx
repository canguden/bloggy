import { requireOrg } from "@/lib/auth/session";
import { getJobForOrg } from "@/lib/jobs/job-queries";
import { PendingArticle } from "@/components/articles/pending-article";

export default async function PendingArticlePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { organizationId } = await requireOrg();
  await getJobForOrg(organizationId, jobId); // authorization check

  return <PendingArticle jobId={jobId} />;
}
