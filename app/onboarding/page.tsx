import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Get started — Bloggy" };

export default async function OnboardingPage() {
  const { organizationId } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  // Already has a site under way — onboarding has nothing left to do.
  if (websites.length > 0) redirect(`/app/websites/${websites[0].id}`);

  return <OnboardingFlow />;
}
