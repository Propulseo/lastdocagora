"use server";

import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types";

type MarkAttendanceResult =
  | { success: true; data: { id: string; status: string; marked_at: string } }
  | { success: false; error: string };

export async function markAttendance(
  appointmentId: string,
  status: AttendanceStatus
): Promise<MarkAttendanceResult> {
  const supabase = await createClient();

  // Verify session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) return { success: false, error: "User not found" };

  const isAdmin = userData.role === "admin";
  const isProfessional = userData.role === "professional";

  if (!isAdmin && !isProfessional) {
    return { success: false, error: "Unauthorized role" };
  }

  // Get appointment and verify ownership
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, professional_id, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };

  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  const now = new Date().toISOString();

  // Upsert attendance record (1-to-1 with appointment)
  const { data, error } = await supabase
    .from("appointment_attendance")
    .upsert(
      {
        appointment_id: appointmentId,
        professional_id: appointment.professional_id,
        professional_user_id: appointment.professional_user_id,
        status,
        marked_at: now,
        marked_by: user.id,
        updated_at: now,
      },
      { onConflict: "appointment_id" }
    )
    .select("id, status, marked_at")
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data };
}
