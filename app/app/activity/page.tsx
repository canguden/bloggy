import { FiGlobe, FiSearch, FiEdit3, FiCheckCircle, FiActivity } from "react-icons/fi";
import { requireOrg } from "@/lib/auth/session";
import { listRecentActivity } from "@/lib/activity/activity-queries";
import { describeActivity } from "@/lib/activity/describe-activity";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatTime } from "@/lib/format";

export const metadata = { title: "Activity — Bloggy" };

const ACTIVITY_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  analyzed_website: FiGlobe,
  found_opportunities: FiSearch,
  generated_article: FiEdit3,
  marked_article_ready: FiCheckCircle,
};

function dayLabel(date: Date): string {
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export default async function ActivityPage() {
  const { organizationId } = await requireOrg();
  const events = await listRecentActivity(organizationId, 100);

  const groups: { label: string; events: typeof events }[] = [];
  for (const event of events) {
    const label = dayLabel(new Date(event.createdAt));
    const group = groups.at(-1);
    if (group && group.label === label) group.events.push(event);
    else groups.push({ label, events: [event] });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <PageHeader title="Activity" description="Everything Bloggy has done, in order." />

      {events.length === 0 ? (
        <EmptyState
          icon={<FiActivity size={18} />}
          title="Nothing yet"
          description="Once Bloggy starts working, every action shows up here."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="eyebrow mb-3 border-b border-line pb-2 text-ink-3">{group.label}</h2>
              <ul className="flex flex-col gap-3.5">
                {group.events.map((event) => {
                  const Icon = ACTIVITY_ICON[event.verb] ?? FiCheckCircle;
                  return (
                    <li key={event.id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-inset text-ink-3">
                        <Icon size={12} />
                      </span>
                      <span className="flex-1 text-[13.5px] text-ink-2">
                        {describeActivity(event.verb, event.payload as Record<string, unknown>)}
                      </span>
                      <span className="mono shrink-0 text-[11.5px] text-ink-3">
                        {formatTime(event.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
