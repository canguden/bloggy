import { requireOrg } from "@/lib/auth/session";
import { listRecentActivity } from "@/lib/activity/activity-queries";
import { describeActivity } from "@/lib/activity/describe-activity";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Activity — Bloggy" };

export default async function ActivityPage() {
  const { organizationId } = await requireOrg();
  const events = await listRecentActivity(organizationId, 50);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 font-serif text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">Activity</h1>
      <p className="mb-8 text-[var(--text-sm)] text-[var(--text-secondary)]">
        Everything Bloggy has done, in order.
      </p>

      {events.length === 0 ? (
        <EmptyState title="Nothing yet" description="Once Bloggy starts working, every action shows up here." />
      ) : (
        <ol className="flex flex-col gap-4 border-l border-[var(--border-subtle)] pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
                {describeActivity(event.verb, event.payload as Record<string, unknown>)}
              </p>
              <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
