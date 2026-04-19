/**
 * Supabase-backed slot availability for a professional on a given date.
 */
import { createClient } from "@/lib/supabase/server"
import {
  generateSlots,
  filterPastSlots,
  type AvailabilityRange,
  type ExistingAppointment,
} from "@/lib/slots"

export async function getAvailableSlotsForProfessional(
  professionalId: string,
  date: string,           // "YYYY-MM-DD"
  serviceDuration: number // minutes
): Promise<string[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(date + "T00:00:00") < today) return []

  const supabase = await createClient()
  const dayOfWeek = new Date(date + "T00:00:00").getDay()

  const [availRes, apptRes] = await Promise.all([
    supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("professional_id", professionalId)
      .neq("is_blocked", true)
      .or(
        `and(specific_date.is.null,day_of_week.eq.${dayOfWeek}),specific_date.eq.${date}`
      ),
    supabase
      .from("appointments")
      .select("appointment_time, duration_minutes")
      .eq("professional_id", professionalId)
      .eq("appointment_date", date)
      .not("status", "in", '("cancelled","rejected")'),
  ])

  const ranges: AvailabilityRange[] = (availRes.data ?? []).map((r) => ({
    start_time: r.start_time,
    end_time: r.end_time,
  }))
  const appointments: ExistingAppointment[] = (apptRes.data ?? []).map(
    (a) => ({
      appointment_time: a.appointment_time,
      duration_minutes: a.duration_minutes,
    })
  )

  const slots = generateSlots(ranges, appointments, serviceDuration)
  return filterPastSlots(slots, date)
}
