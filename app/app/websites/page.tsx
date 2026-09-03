import Link from "next/link";
import { FiCheckCircle, FiAlertTriangle, FiClock, FiChevronRight, FiGlobe } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { AddWebsiteForm } from "@/components/websites/add-website-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SiteChip } from "@/components/ui/site-chip";

export const metadata = { title: "Websites — Bloggy" };

const STATUS: Record<
  "pending" | "analyzing" | "active" | "failed",
  { tone: "neutral" | "accent" | "ok" | "bad"; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  pending: { tone: "neutral", label: "Queued", icon: FiClock },
  analyzing: { tone: "accent", label: "Analyzing", icon: (p) => <CgSpinner {...p} className="animate-spin" /> },
  active: { tone: "ok", label: "Active", icon: FiCheckCircle },
  failed: { tone: "bad", label: "Needs attention", icon: FiAlertTriangle },
};

export default async function WebsitesPage() {
  const { organizationId } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <PageHeader
        title="Websites"
        description="Add a website and Bloggy will read it, understand the business, and start finding content opportunities."
      />

      <Card className="mb-8 p-5">
        <AddWebsiteForm />
      </Card>

      {websites.length === 0 ? (
        <EmptyState
          icon={<FiGlobe size={18} />}
          title="No websites yet"
          description="Add your first website above — Bloggy will analyze it and tell you what to write about."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line bg-paper-raised">
          {websites.map((site) => {
            const status = STATUS[site.status];
            const StatusIcon = status.icon;
            return (
              <li key={site.id}>
                <Link
                  href={`/app/websites/${site.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-[var(--dur-color)] hover:bg-paper-sunken"
                >
                  <SiteChip domain={site.domain} faviconUrl={site.faviconUrl} />
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={status.tone} icon={<StatusIcon size={11} />}>
                      {status.label}
                    </Badge>
                    <FiChevronRight size={15} className="text-ink-3" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
