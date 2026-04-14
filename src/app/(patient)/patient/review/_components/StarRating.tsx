"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (v: number) => void
  size?: "lg" | "sm"
  label?: string
}

export function StarRating({
  value,
  onChange,
  size = "lg",
  label,
}: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const starSize = size === "lg" ? "size-8" : "size-5"

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hover || value)
          return (
            <button
              key={star}
              type="button"
              className={cn(
                "min-h-[44px] min-w-[44px] flex items-center justify-center",
                "rounded-md transition-colors",
                "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:outline-none"
              )}
              onMouseEnter={() => setHover(star)}
              onClick={() => onChange(star)}
              aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  starSize,
                  "transition-colors",
                  filled
                    ? "text-amber-400 drop-shadow-sm"
                    : "text-muted-foreground/30"
                )}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
