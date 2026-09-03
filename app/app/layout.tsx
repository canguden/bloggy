import { redirect } from "next/navigation";
import { getSession, requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Proxy already redirects logged-out visitors optimistically; this is the
  // real authorization check the app relies on.
  if (!session) redirect("/login");

  const { organizationId } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  return (
    <AppShell userName={session.user.name} userEmail={session.user.email} websites={websites}>
      {children}
    </AppShell>
  );
}
