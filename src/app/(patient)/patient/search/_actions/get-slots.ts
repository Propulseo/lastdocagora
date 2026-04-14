"use server"

import { createClient } from "@/lib/supabase/server"
import { format, addDays, startOfDay } from "date-fns"

export interface SlotsByDay {
  date: string // "2026-04-07"
  dayOfWeek: number // 0-6
  slots: string[] // ["11:00", "12:00", "14:00"]
}

export async function getAvailableSlotsForPro(
  professionalId: string,
  daysToShow: number = 5,
  maxSlotsPerDay: number = 4
): Promise<SlotsByDay[]> {
  const supabase = await createClient()

  // 1. Get availability days for this pro (non-blocked)
  const { data: availabilities } = await supabase
    .from("availability")
    .select("day_of_week")
    .eq("professional_id", professionalId)
    .neq("is_blocked", true)

  if (!availabilities?.length) return []

  const availableDays = new Set(availabilities.map((a) => a.day_of_week))

  // 2. Find next N days that match available day_of_week
  const today = startOfDay(new Date())
  const candidateDates: { date: Date; dateStr: string }[] = []

  for (let i = 0; i < 21 && candidateDates.length < daysToShow + 3; i++) {
    const date = addDays(today, i)
    if (availableDays.has(date.getDay())) {
      candidateDates.push({ date, dateStr: format(date, "yyyy-MM-dd") })
    }
  }

  if (candidateDates.length === 0) return []

  // 3. For each candidate date, get actual free slots via RPC
  const results = await Promise.all(
    candidateDates.map(async ({ date, dateStr }) => {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_date: dateStr,
        p_professional_id: professionalId,
      })

      if (error || !data) return null

      const now = new Date()
      const todayStr = format(now, "yyyy-MM-dd")
      const marginMs = 30 * 60 * 1000 // 30 minutes

      const allSlots = (data as { slot_start: string; slot_end: string }[])
        .filter((s) => {
          // For today, exclude slots whose start is <= now + 30min
          if (dateStr === todayStr) {
            const slotStart = new Date(`${dateStr}T${s.slot_start}`)
            return slotStart.getTime() > now.getTime() + marginMs
          }
          return true
        })
        .map((s) => s.slot_start.slice(0, 5))

      if (allSlots.length === 0) return null

      return {
        date: dateStr,
        dayOfWeek: date.getDay(),
        slots: allSlots.slice(0, maxSlotsPerDay),
      }
    })
  )

  return results.filter((r): r is SlotsByDay => r !== null).slice(0, daysToShow)
}
