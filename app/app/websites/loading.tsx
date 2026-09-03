import { Skeleton } from "@/components/ui/skeleton";

export default function WebsitesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <Skeleton className="mb-2 h-9 w-40" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <Skeleton className="mb-8 h-16 w-full" />
      <div className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
