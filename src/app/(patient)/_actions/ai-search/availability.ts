import { createClient } from "@/lib/supabase/server"
import type { ProfessionalResult } from "@/app/(patient)/patient/search/_components/professional-card"

export async function filterByAvailability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionals: ProfessionalResult[],
  requestedDate: string,
  requestedTime?: string
): Promise<ProfessionalResult[]> {
  const results = await Promise.all(
    professionals.map(async (prof) => {
      try {
        const { data, error } = await supabase.rpc("get_available_slots", {
          p_professional_id: prof.id,
          p_date: requestedDate,
        })
        if (error) {
          console.error(`[ai-search] get_available_slots error for ${prof.id}:`, error.message)
          return null
        }
        const slots = (data as { slot_start: string; slot_end: string }[] | null) ?? []
        if (slots.length === 0) return null

        // Extract HH:MM from slot_start (time format "HH:MM:SS" → slice 0,5)
        let slotTimes = slots.map((s) => s.slot_start.slice(0, 5))

        // If a specific time was requested, only keep matching slots
        if (requestedTime) {
          slotTimes = slotTimes.filter((t) => t === requestedTime)
          if (slotTimes.length === 0) return null
        }

        // Limit to 6 slots max
        return {
          ...prof,
          available_slots: slotTimes.slice(0, 6),
          requested_date: requestedDate,
        }
      } catch {
        console.error(`[ai-search] get_available_slots exception for ${prof.id}`)
        return null
      }
    })
  )
  return results.filter((r) => r !== null) as ProfessionalResult[]
}
