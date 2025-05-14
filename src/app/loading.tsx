// src/app/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-12 w-1/2 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
       <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
