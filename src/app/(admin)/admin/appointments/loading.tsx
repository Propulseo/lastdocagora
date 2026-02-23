import { Skeleton } from "@/components/ui/skeleton";
import { AdminSkeletonTable } from "@/app/(admin)/_components/admin-skeleton-table";

export default function AppointmentsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <AdminSkeletonTable columns={6} rows={8} />
    </div>
  );
}
