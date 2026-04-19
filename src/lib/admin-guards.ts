import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recalculate a professional's average rating from approved reviews.
 * Extracted from deleteReview to be reusable by updateReviewStatus.
 */
export async function recalculateProfessionalRating(
  professionalId: string,
  supabase: SupabaseClient
) {
  const { data: stats } = await supabase
    .from("reviews")
    .select("rating")
    .eq("professional_id", professionalId)
    .eq("status", "approved");

  if (stats && stats.length > 0) {
    const avg = stats.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / stats.length;
    await supabase
      .from("professionals")
      .update({ rating: Math.round(avg * 10) / 10, total_reviews: stats.length })
      .eq("id", professionalId);
  } else {
    await supabase
      .from("professionals")
      .update({ rating: null, total_reviews: 0 })
      .eq("id", professionalId);
  }
}

/**
 * Check if an entity (professional or patient) has future pending/confirmed appointments.
 */
export async function hasFutureAppointments(
  entityType: "professional" | "patient",
  entityId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const column = entityType === "professional" ? "professional_id" : "patient_id";
  const today = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq(column, entityId)
    .gte("appointment_date", today)
    .in("status", ["pending", "confirmed"]);

  return (count ?? 0) > 0;
}

/**
 * Cancel all future pending/confirmed appointments for an entity and notify affected parties.
 * Returns the number of cancelled appointments.
 */
export async function cancelFutureAppointments(
  entityType: "professional" | "patient",
  entityId: string,
  supabase: SupabaseClient,
  reason: string
): Promise<number> {
  const column = entityType === "professional" ? "professional_id" : "patient_id";
  const notifyColumn = entityType === "professional" ? "patient_user_id" : "professional_user_id";
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Fetch future appointments to cancel
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`id, ${notifyColumn}`)
    .eq(column, entityId)
    .gte("appointment_date", today)
    .in("status", ["pending", "confirmed"]);

  if (!appointments || appointments.length === 0) return 0;

  // Cancel all
  const ids = appointments.map((a: { id: string }) => a.id);
  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .in("id", ids);

  // Notify each affected user (skip duplicates)
  const notifiedUsers = new Set<string>();
  for (const appt of appointments) {
    const userId = (appt as Record<string, string>)[notifyColumn];
    if (!userId || notifiedUsers.has(userId)) continue;
    notifiedUsers.add(userId);

    // Skip notification if user is suspended
    const { data: userRecord } = await supabase
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();
    if (userRecord?.status === "suspended") continue;

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Appointment cancelled",
      message: reason,
      type: "cancellation",
    });
  }

  return appointments.length;
}

/**
 * Derive appointment status from attendance status (same logic as pro-side).
 */
export function deriveAppointmentStatus(
  attendance: string,
  currentStatus: string
): string {
  if (attendance === "present" || attendance === "late") return "confirmed";
  if (attendance === "absent") return "no-show";
  return currentStatus;
}
