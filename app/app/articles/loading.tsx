import { Skeleton } from "@/components/ui/skeleton";

export default function ArticlesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="mb-2 h-9 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="flex flex-col divide-y divide-line rounded-[var(--radius-md)] border border-line">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
