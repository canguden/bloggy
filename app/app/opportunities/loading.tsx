import { Skeleton } from "@/components/ui/skeleton";

export default function OpportunitiesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="mb-8 h-4 w-80 max-w-full" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] border border-line p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-14 w-16 shrink-0" />
            </div>
            <Skeleton className="mb-4 h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
