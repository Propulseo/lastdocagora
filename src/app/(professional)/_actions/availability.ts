"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAvailabilitySlot(availabilityId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify the slot belongs to the connected professional
  const { data: slot } = await supabase
    .from("availability")
    .select("id, professional_id")
    .eq("id", availabilityId)
    .single();

  if (!slot) return { success: false, error: "Créneau introuvable" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro || pro.id !== slot.professional_id) {
    return { success: false, error: "Accès refusé" };
  }

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", availabilityId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/agenda");
  return { success: true };
}

export async function deleteAllDayAvailability(
  professionalId: string,
  dayOfWeek: number,
  specificDate?: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify ownership
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro || pro.id !== professionalId) {
    return { success: false, error: "Accès refusé" };
  }

  let query = supabase
    .from("availability")
    .delete()
    .eq("professional_id", professionalId)
    .eq("is_blocked", false);

  if (specificDate) {
    // Delete specific-date entries + recurring entries for this day of week
    // Both are shown on that day, both should be cleared
    query = query.or(
      `specific_date.eq.${specificDate},and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek})`,
    );
  } else {
    query = query.eq("day_of_week", dayOfWeek).eq("is_recurring", true);
  }

  const { error } = await query;
  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/agenda");
  return { success: true };
}
