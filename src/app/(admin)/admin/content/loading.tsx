import { Skeleton } from "@/components/ui/skeleton";
import { AdminSkeletonTable } from "@/app/(admin)/_components/admin-skeleton-table";

export default function ContentLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-48" />
      <AdminSkeletonTable columns={4} rows={5} />
    </div>
  );
}
