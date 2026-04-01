"use client"

import { format } from "date-fns"
import type { Locale } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Loader2,
  CalendarDays,
  Sun,
  Sunset,
} from "lucide-react"

type Slot = { slot_start: string; slot_end: string }

function groupSlotsByPeriod(slots: Slot[]) {
  const morning: Slot[] = []
  const afternoon: Slot[] = []

  for (const slot of slots) {
    const hour = parseInt(slot.slot_start.slice(0, 2), 10)
    if (hour < 13) {
      morning.push(slot)
    } else {
      afternoon.push(slot)
    }
  }

  return { morning, afternoon }
}

interface BookingDateTimeStepProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
  isDayDisabled: (date: Date) => boolean
  dateLocale: Locale
  slots: Slot[]
  loadingSlots: boolean
  onSlotSelect: (time: string) => void
  hasAvailability: boolean
  t: {
    step2: string
    step3: string
    dateFormat: string
    loadingSlots: string
    noSlots: string
    morning: string
    afternoon: string
  }
}

function SlotGrid({
  slots,
  onSlotSelect,
}: {
  slots: Slot[]
  onSlotSelect: (time: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const time = slot.slot_start.slice(0, 5)
        return (
          <Button
            key={slot.slot_start}
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] rounded-lg font-mono text-sm hover:bg-primary hover:text-primary-foreground"
            onClick={() => onSlotSelect(time)}
          >
            {time}
          </Button>
        )
      })}
    </div>
  )
}

export function BookingDateTimeStep({
  selectedDate,
  onDateSelect,
  isDayDisabled,
  dateLocale,
  slots,
  loadingSlots,
  onSlotSelect,
  hasAvailability,
  t,
}: BookingDateTimeStepProps) {
  const { morning, afternoon } = groupSlotsByPeriod(slots)

  return (
    <div className="space-y-5">
      {!hasAvailability ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t.noSlots}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">{t.step2}</p>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={isDayDisabled}
            locale={dateLocale}
            className="mx-auto rounded-xl border p-3"
          />
        </div>
      )}

      {selectedDate && (
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {t.step3} &mdash;{" "}
              <span className="font-normal text-muted-foreground">
                {format(selectedDate, t.dateFormat, {
                  locale: dateLocale,
                })}
              </span>
            </p>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t.loadingSlots}
              </span>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t.noSlots}
            </p>
          ) : (
            <div className="space-y-4">
              {morning.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Sun className="size-3" />
                    <span>{t.morning}</span>
                  </div>
                  <SlotGrid slots={morning} onSlotSelect={onSlotSelect} />
                </div>
              )}
              {afternoon.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Sunset className="size-3" />
                    <span>{t.afternoon}</span>
                  </div>
                  <SlotGrid slots={afternoon} onSlotSelect={onSlotSelect} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
