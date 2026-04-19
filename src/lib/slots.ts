/**
 * Pure slot generation — no Supabase dependency.
 * Splits availability windows into bookable time slots.
 */

export type AvailabilityRange = {
  start_time: string // "HH:mm"
  end_time: string   // "HH:mm"
}

export type ExistingAppointment = {
  appointment_time: string // "HH:mm" or "HH:mm:ss"
  duration_minutes: number
}

const SLOT_STEP = 30 // 30-minute granularity

/** Convert "HH:mm" or "HH:mm:ss" to minutes since midnight */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** Convert minutes since midnight to "HH:mm" */
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Generate bookable slot start times from availability ranges.
 *
 * Steps every SLOT_STEP (30) minutes. A slot is valid when:
 *   1. slotStart + serviceDuration <= rangeEnd
 *   2. [slotStart, slotStart + serviceDuration) overlaps no existing appointment
 */
export function generateSlots(
  availabilityRanges: AvailabilityRange[],
  existingAppointments: ExistingAppointment[],
  serviceDuration: number
): string[] {
  const booked = existingAppointments.map((a) => {
    const start = toMinutes(a.appointment_time)
    return { start, end: start + a.duration_minutes }
  })

  const slots: string[] = []

  for (const range of availabilityRanges) {
    const rangeStart = toMinutes(range.start_time)
    const rangeEnd = toMinutes(range.end_time)

    for (
      let cursor = rangeStart;
      cursor + serviceDuration <= rangeEnd;
      cursor += SLOT_STEP
    ) {
      const slotEnd = cursor + serviceDuration
      const overlaps = booked.some(
        (b) => cursor < b.end && slotEnd > b.start
      )
      if (!overlaps) {
        slots.push(fromMinutes(cursor))
      }
    }
  }

  return slots
}

/**
 * For today, remove slots whose start < now + 30 min.
 * For future dates return all. For past dates return [].
 */
export function filterPastSlots(slots: string[], date: string): string[] {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const slotDate = new Date(date + "T00:00:00")
  if (slotDate < today) return []
  if (slotDate > today) return slots

  const cutoff = now.getHours() * 60 + now.getMinutes() + 30
  return slots.filter((s) => toMinutes(s) >= cutoff)
}
