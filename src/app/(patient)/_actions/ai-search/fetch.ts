"use server"

import { createClient } from "@/lib/supabase/server"

// Action séparée pour charger les créneaux après affichage des résultats
export async function fetchNextSlot(professionalId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_next_available_slot", {
      p_professional_id: professionalId,
    })
    if (error) return null
    return (data as string | null) ?? null
  } catch {
    return null
  }
}
