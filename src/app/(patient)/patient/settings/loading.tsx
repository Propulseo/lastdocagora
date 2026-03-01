import { CardSkeleton } from "@/app/(patient)/_components/patient-loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <CardSkeleton lines={5} />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={2} />
    </div>
  )
}
