import { CardSkeleton } from "@/app/(patient)/_components/patient-loading"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
        <CardSkeleton lines={8} />
      </div>
    </div>
  )
}
