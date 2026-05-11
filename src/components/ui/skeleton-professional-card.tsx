"use client"

import { cn } from "@/lib/utils"

export function SkeletonProfessionalCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-4 animate-pulse", className)}>
      <div className="flex gap-3">
        <div className="size-12 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
        <div className="hidden sm:block space-y-2">
          <div className="h-8 w-24 rounded-lg bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfessionalCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 pl-11">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProfessionalCard
          key={i}
          className={cn(
            "animate-pulse",
            i === 1 && "[animation-delay:100ms]",
            i === 2 && "[animation-delay:200ms]"
          )}
        />
      ))}
    </div>
  )
}
