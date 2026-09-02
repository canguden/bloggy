import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";

/**
 * Placeholder home: routes to the one meaningful next action until the real
 * operations-center dashboard (opportunities/articles/activity) lands once
 * those features exist.
 */
export default async function AppHomePage() {
  const { organizationId } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  if (websites.length === 0) redirect("/app/websites");
  redirect(`/app/websites/${websites[0].id}`);
}
