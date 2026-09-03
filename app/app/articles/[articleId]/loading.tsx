import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="mx-auto flex w-full max-w-[68ch] flex-1 flex-col gap-6 px-6 py-10">
          <Skeleton className="h-11 w-3/4" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="w-full shrink-0 border-t border-line px-6 py-8 lg:w-72 lg:border-l lg:border-t-0">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="mb-6 h-6 w-20 rounded-full" />
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
