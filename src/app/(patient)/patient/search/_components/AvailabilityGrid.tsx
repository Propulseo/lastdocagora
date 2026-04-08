"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { pt as ptLocale } from "date-fns/locale/pt"
import { fr as frLocale } from "date-fns/locale/fr"
import { enUS as enLocale } from "date-fns/locale/en-US"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAvailableSlotsForPro, type SlotsByDay } from "../_actions/get-slots"

const DATE_LOCALES: Record<string, typeof ptLocale> = {
  pt: ptLocale,
  fr: frLocale,
  en: enLocale,
}

interface AvailabilityGridProps {
  professionalId: string
  locale: string
  noSlotsLabel: string
  moreSlotsLabel: string
  onSlotSelect: (date: string, time: string) => void
  onMoreSlots: () => void
}

export function AvailabilityGrid({
  professionalId,
  locale,
  noSlotsLabel,
  moreSlotsLabel,
  onSlotSelect,
  onMoreSlots,
}: AvailabilityGridProps) {
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  // Lazy load: fetch slots when component enters viewport
  useEffect(() => {
    if (loadedRef.current) return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadedRef.current) {
          loadedRef.current = true
          setLoading(true)
          getAvailableSlotsForPro(professionalId, 5, 4)
            .then((result) => setSlotsByDay(result))
            .catch(() => setSlotsByDay([]))
            .finally(() => setLoading(false))
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [professionalId])

  const dateLocale = DATE_LOCALES[locale] ?? ptLocale
  const DAYS_VISIBLE = 5

  const formatDayLabel = useCallback(
    (dateStr: string) => {
      const date = parseISO(dateStr)
      return format(date, "EEE", { locale: dateLocale }).replace(".", "")
    },
    [dateLocale]
  )

  const formatDateLabel = useCallback(
    (dateStr: string) => {
      const date = parseISO(dateStr)
      return format(date, "d MMM", { locale: dateLocale }).replace(".", "")
    },
    [dateLocale]
  )

  // Skeleton while loading
  if (loading || slotsByDay === null) {
    return (
      <div ref={containerRef} className="mt-3 border-t border-border/50 pt-3">
        <div className="flex items-center justify-center py-4">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
          )}
        </div>
      </div>
    )
  }

  // No slots available
  if (slotsByDay.length === 0) {
    return (
      <div ref={containerRef} className="mt-3 border-t border-border/50 pt-3">
        <p className="text-center text-xs text-muted-foreground py-2">
          {noSlotsLabel}
        </p>
      </div>
    )
  }

  const visibleDays = slotsByDay.slice(offset, offset + DAYS_VISIBLE)
  const maxRows = Math.max(...visibleDays.map((d) => d.slots.length))
  const canPrev = offset > 0
  const canNext = offset + DAYS_VISIBLE < slotsByDay.length

  return (
    <div ref={containerRef} className="mt-3 border-t border-border/50 pt-3">
      {/* Day navigation + grid */}
      <div className="flex items-start gap-1">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOffset((o) => o - 1)
          }}
          disabled={!canPrev}
          className="mt-3 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous days"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          className="flex-1 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${DAYS_VISIBLE}, 1fr)` }}
        >
          {/* Day headers */}
          {visibleDays.map((day) => (
            <div key={day.date} className="text-center pb-1">
              <p className="text-[10px] font-semibold text-foreground leading-tight capitalize">
                {formatDayLabel(day.date)}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {formatDateLabel(day.date)}
              </p>
            </div>
          ))}

          {/* Slot buttons row by row */}
          {Array.from({ length: maxRows }, (_, rowIdx) =>
            visibleDays.map((day) => {
              const slot = day.slots[rowIdx]
              if (!slot) {
                return (
                  <div
                    key={`${day.date}-empty-${rowIdx}`}
                    className="h-7"
                  />
                )
              }
              return (
                <button
                  key={`${day.date}-${slot}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSlotSelect(day.date, slot)
                  }}
                  className={cn(
                    "h-7 rounded-md text-[11px] font-semibold",
                    "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
                    "border border-teal-200 dark:border-teal-800",
                    "hover:bg-teal-600 hover:text-white hover:border-teal-600",
                    "dark:hover:bg-teal-600 dark:hover:text-white dark:hover:border-teal-600",
                    "transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  )}
                >
                  {slot}
                </button>
              )
            })
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOffset((o) => o + 1)
          }}
          disabled={!canNext}
          className="mt-3 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next days"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* See more link */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMoreSlots()
        }}
        className="mt-1.5 w-full text-center text-xs text-teal-600 dark:text-teal-400
                   hover:text-teal-800 dark:hover:text-teal-200 hover:underline py-1 transition-colors"
      >
        {moreSlotsLabel}
      </button>
    </div>
  )
}
