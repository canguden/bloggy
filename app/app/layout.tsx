import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { organizationId, user } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  return (
    <AppShell userName={user.name} userEmail={user.email} websites={websites}>
      {children}
    </AppShell>
  );
}
