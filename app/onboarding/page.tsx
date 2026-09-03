import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg, getWebsiteForOrg } from "@/lib/websites/website-queries";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Get started — Bloggy" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ websiteId?: string; jobId?: string }>;
}) {
  const { organizationId } = await requireOrg();
  const { websiteId, jobId } = await searchParams;

  // Arrived with a website + job already underway (URL entered on the
  // landing page, carried through signup/login) — verify it's actually
  // this org's before trusting it, then jump straight to the analyzing step.
  if (websiteId && jobId) {
    const website = await getWebsiteForOrg(organizationId, websiteId).catch(() => null);
    if (website) {
      return <OnboardingFlow initial={{ websiteId, jobId, domain: website.domain }} />;
    }
  }

  const websites = await listWebsitesForOrg(organizationId);

  // Already has a site under way — onboarding has nothing left to do.
  if (websites.length > 0) redirect(`/app/websites/${websites[0].id}`);

  return <OnboardingFlow />;
}
