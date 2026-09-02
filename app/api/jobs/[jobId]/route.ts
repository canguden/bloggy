import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth/session";
import { getJobForOrg } from "@/lib/jobs/job-queries";
import { toUserMessage } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { organizationId } = await requireOrg();
    const { jobId } = await params;
    const job = await getJobForOrg(organizationId, jobId);

    return NextResponse.json({
      id: job.id,
      status: job.status,
      steps: job.steps,
      errorMessage: job.errorMessage,
    });
  } catch (err) {
    return NextResponse.json({ error: toUserMessage(err) }, { status: 400 });
  }
}
