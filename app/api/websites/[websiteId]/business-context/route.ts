import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth/session";
import { getWebsiteForOrg } from "@/lib/websites/website-queries";
import { getCurrentBusinessContext } from "@/lib/business-context/get-business-context";
import { toUserMessage } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  try {
    const { organizationId } = await requireOrg();
    const { websiteId } = await params;
    await getWebsiteForOrg(organizationId, websiteId); // authorization check

    const context = await getCurrentBusinessContext(websiteId);
    return NextResponse.json({ context });
  } catch (err) {
    return NextResponse.json({ error: toUserMessage(err) }, { status: 400 });
  }
}
