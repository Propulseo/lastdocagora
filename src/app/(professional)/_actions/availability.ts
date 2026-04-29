"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeDbError } from "@/lib/errors";

export async function deleteAvailabilitySlot(availabilityId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify the slot belongs to the connected professional
  const { data: slot } = await supabase
    .from("availability")
    .select("id, professional_id, start_time, end_time, specific_date, day_of_week, is_recurring")
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

  // Guard: check for pending/confirmed appointments on this slot
  let apptQuery = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", slot.professional_id)
    .in("status", ["pending", "confirmed"]);

  if (slot.specific_date) {
    // Non-recurring slot: check appointments on that specific date within the time range
    apptQuery = apptQuery
      .gte("scheduled_at", `${slot.specific_date}T${slot.start_time}`)
      .lt("scheduled_at", `${slot.specific_date}T${slot.end_time}`);
  } else if (slot.is_recurring) {
    // Recurring slot: check future appointments on matching day_of_week within time range
    const today = new Date().toISOString().split("T")[0];
    apptQuery = apptQuery
      .gte("scheduled_at", `${today}T00:00:00`);
  }

  const { count: linkedCount } = await apptQuery;

  if (linkedCount && linkedCount > 0) {
    return { success: false, error: "cannotDeleteWithAppointment" };
  }

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", availabilityId);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-availability") };

  revalidatePath("/pro/agenda");
  return { success: true };
}

export async function pasteAvailabilitySlots(
  professionalId: string,
  slots: { start_time: string; end_time: string }[],
  targetDates: string[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié", created: 0, skipped: 0 };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro || pro.id !== professionalId) {
    return { success: false, error: "Accès refusé", created: 0, skipped: 0 };
  }

  let totalCreated = 0;
  let totalSkipped = 0;

  await Promise.all(
    targetDates.map(async (targetDate) => {
      const d = new Date(targetDate + "T00:00:00");
      const dayOfWeek = d.getDay();

      // Fetch existing slots on this date for dedup
      const { data: existing } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("professional_id", professionalId)
        .eq("is_blocked", false)
        .or(
          `specific_date.eq.${targetDate},and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek})`,
        );

      const existingSet = new Set(
        (existing ?? []).map((e) => `${e.start_time}|${e.end_time}`),
      );

      const toInsert = slots.filter(
        (s) => !existingSet.has(`${s.start_time}|${s.end_time}`),
      );

      const skipped = slots.length - toInsert.length;
      totalSkipped += skipped;

      if (toInsert.length > 0) {
        const rows = toInsert.map((s) => ({
          professional_id: professionalId,
          professional_user_id: user.id,
          day_of_week: dayOfWeek,
          start_time: s.start_time,
          end_time: s.end_time,
          is_recurring: false,
          specific_date: targetDate,
          is_blocked: false,
        }));

        const { error } = await supabase.from("availability").insert(rows);
        if (!error) {
          totalCreated += toInsert.length;
        }
      }
    }),
  );

  revalidatePath("/pro/agenda");
  return { success: true, created: totalCreated, skipped: totalSkipped };
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
  if (error) return { success: false, error: sanitizeDbError(error, "pro-availability") };

  revalidatePath("/pro/agenda");
  return { success: true };
}
