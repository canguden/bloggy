import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Proxy already redirects logged-out visitors optimistically; this is the
  // real authorization check the app relies on.
  if (!session) redirect("/login");

  return (
    <AppShell userName={session.user.name} userEmail={session.user.email}>
      {children}
    </AppShell>
  );
}
