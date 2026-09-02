import Link from "next/link";
import { requireOrg } from "@/lib/auth/session";
import { listWebsitesForOrg } from "@/lib/websites/website-queries";
import { AddWebsiteForm } from "@/components/websites/add-website-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Websites — Bloggy" };

const statusTone = {
  pending: "neutral",
  analyzing: "accent",
  active: "success",
  failed: "danger",
} as const;

const statusLabel = {
  pending: "Queued",
  analyzing: "Analyzing",
  active: "Active",
  failed: "Needs attention",
} as const;

export default async function WebsitesPage() {
  const { organizationId } = await requireOrg();
  const websites = await listWebsitesForOrg(organizationId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
        Websites
      </h1>
      <p className="mb-8 text-[var(--text-sm)] text-[var(--text-secondary)]">
        Add a website and Bloggy will read it, understand the business, and start finding content
        opportunities.
      </p>

      <Card className="mb-10 p-5">
        <AddWebsiteForm />
      </Card>

      {websites.length === 0 ? (
        <EmptyState
          title="No websites yet"
          description="Add your first website above. Bloggy will analyze it and tell you what to write about."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
          {websites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/app/websites/${site.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)]"
              >
                <div>
                  <p className="text-[var(--text-base)] font-medium text-[var(--text-primary)]">{site.domain}</p>
                  <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{site.url}</p>
                </div>
                <Badge tone={statusTone[site.status]}>{statusLabel[site.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
