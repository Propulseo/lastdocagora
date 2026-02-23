import { Skeleton } from "@/components/ui/skeleton";
import { AdminSkeletonTable } from "@/app/(admin)/_components/admin-skeleton-table";

export default function ProfessionalsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-40" />
      </div>
      <AdminSkeletonTable columns={7} rows={8} />
    </div>
  );
}
