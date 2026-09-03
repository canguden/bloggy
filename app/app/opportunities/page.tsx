import { FiTarget } from "react-icons/fi";
import { requireOrg } from "@/lib/auth/session";
import { listOpportunitiesForOrg } from "@/lib/content/opportunity-queries";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { OpportunityList } from "@/components/opportunities/opportunity-list";

export const metadata = { title: "Opportunities — Bloggy" };

export default async function OpportunitiesPage() {
  const { organizationId } = await requireOrg();
  const rows = await listOpportunitiesForOrg(organizationId);
  const active = rows.filter((r) => r.opportunity.status !== "dismissed");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <PageHeader
        title="Opportunities"
        description="What Bloggy found worth writing about, ranked by fit for your business."
      />

      {active.length === 0 ? (
        <EmptyState
          icon={<FiTarget size={18} />}
          title="No opportunities yet"
          description="Add a website and run research to see Bloggy's prioritized list of content opportunities."
        />
      ) : (
        <OpportunityList
          items={active.map(({ opportunity, website, targetKeyword }) => ({
            opportunity,
            domain: website.domain,
            faviconUrl: website.faviconUrl,
            keyword: targetKeyword?.keyword ?? null,
            volume: targetKeyword?.volume ?? null,
          }))}
        />
      )}
    </div>
  );
}
