import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
