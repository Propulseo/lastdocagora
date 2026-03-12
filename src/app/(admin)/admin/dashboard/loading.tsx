import { Skeleton } from "@/components/ui/skeleton";
import { AdminSkeletonTable } from "@/app/(admin)/_components/admin-skeleton-table";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <AdminSkeletonTable columns={6} rows={5} />
    </div>
  );
}
