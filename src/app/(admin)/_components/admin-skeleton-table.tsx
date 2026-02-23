import { Skeleton } from "@/components/ui/skeleton";

interface AdminSkeletonTableProps {
  columns: number;
  rows?: number;
}

export function AdminSkeletonTable({
  columns,
  rows = 5,
}: AdminSkeletonTableProps) {
  return (
    <div className="rounded-md border" aria-busy="true">
      <div className="border-b p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-4"
                style={{ width: `${60 + Math.random() * 80}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
