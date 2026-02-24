import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trends chart */}
      <StatsChartSkeleton height={300} />

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatsChartSkeleton height={250} />
        <StatsChartSkeleton height={250} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <StatsChartSkeleton height={200} />
        <StatsChartSkeleton height={200} />
      </div>

      {/* Retention */}
      <StatsChartSkeleton height={100} />

      {/* Insights */}
      <StatsChartSkeleton height={200} />
    </div>
  );
}
