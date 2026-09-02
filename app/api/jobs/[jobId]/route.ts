import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth/session";
import { getJobForOrg } from "@/lib/jobs/job-queries";
import { toUserMessage } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { organizationId } = await requireOrg();
    const { jobId } = await params;
    const job = await getJobForOrg(organizationId, jobId);

    const cursor = (job.cursor as Record<string, unknown>) ?? {};
    const articleResult = cursor["article__result"] as { articleId?: string } | undefined;

    return NextResponse.json({
      id: job.id,
      status: job.status,
      steps: job.steps,
      errorMessage: job.errorMessage,
      articleId: articleResult?.articleId,
    });
  } catch (err) {
    return NextResponse.json({ error: toUserMessage(err) }, { status: 400 });
  }
}
