import { requireOrg } from "@/lib/auth/session";
import { listOpportunitiesForOrg } from "@/lib/content/opportunity-queries";
import { EmptyState } from "@/components/ui/empty-state";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";

export const metadata = { title: "Opportunities — Bloggy" };

export default async function OpportunitiesPage() {
  const { organizationId } = await requireOrg();
  const rows = await listOpportunitiesForOrg(organizationId);
  const active = rows.filter((r) => r.opportunity.status !== "dismissed");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
        Opportunities
      </h1>
      <p className="mb-8 text-[var(--text-sm)] text-[var(--text-secondary)]">
        What Bloggy found worth writing about, ranked by fit for your business.
      </p>

      {active.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Add a website and run research to see Bloggy's prioritized list of content opportunities."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {active.map(({ opportunity, website }) => (
            <li key={opportunity.id}>
              <OpportunityCard opportunity={opportunity} domain={website.domain} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
