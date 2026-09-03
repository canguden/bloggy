import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <Skeleton className="mb-2 h-9 w-32" />
      <Skeleton className="mb-8 h-4 w-56 max-w-full" />
      <div className="flex flex-col gap-8">
        {[0, 1].map((g) => (
          <div key={g}>
            <Skeleton className="mb-3 h-3 w-16" />
            <div className="flex flex-col gap-3.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
