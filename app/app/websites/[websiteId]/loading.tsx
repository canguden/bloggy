import { Skeleton } from "@/components/ui/skeleton";

export default function WebsiteDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="mb-1.5 h-9 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
