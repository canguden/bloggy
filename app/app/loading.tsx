import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <Skeleton className="mb-2 h-9 w-56" />
      <Skeleton className="mb-8 h-4 w-72 max-w-full" />
      <Skeleton className="mb-8 h-20 w-full" />
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
