import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <Skeleton className="mb-8 h-9 w-32" />
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-10 h-24 w-full" />
      <Skeleton className="mb-3 h-3 w-16" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
