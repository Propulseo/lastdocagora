"use server";

import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types";

type MarkAttendanceResult =
  | { success: true; data: { id: string; status: string; marked_at: string | null }; appointmentStatus: string }
  | { success: false; error: string };

const VALID_STATUSES: AttendanceStatus[] = ["waiting", "present", "absent", "late", "cancelled"];

/** Maps attendance status → appointment status */
function deriveAppointmentStatus(attendance: AttendanceStatus, currentStatus: string): string {
  if (attendance === "present" || attendance === "late") return "confirmed";
  if (attendance === "absent") return "no_show";
  // "waiting" or "cancelled" → keep current
  return currentStatus;
}

export async function markAttendance(
  appointmentId: string,
  status: AttendanceStatus
): Promise<MarkAttendanceResult> {
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

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
    .select("id, professional_id, professional_user_id, status")
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

  // Sync appointment status based on attendance
  const newAppointmentStatus = deriveAppointmentStatus(status, appointment.status);
  if (newAppointmentStatus !== appointment.status) {
    await supabase
      .from("appointments")
      .update({ status: newAppointmentStatus, updated_at: now })
      .eq("id", appointmentId);
  }

  return { success: true, data, appointmentStatus: newAppointmentStatus };
}

/* ─── Confirm / Cancel appointment (pro action) ─── */
type UpdateStatusResult =
  | { success: true; status: string }
  | { success: false; error: string };

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["pending"],                // can confirm a pending appointment
  cancelled: ["pending", "confirmed"],   // can cancel pending or confirmed
};

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: "confirmed" | "cancelled",
): Promise<UpdateStatusResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) return { success: false, error: "User not found" };

  const isAdmin = userData.role === "admin";
  const isProfessional = userData.role === "professional";
  if (!isAdmin && !isProfessional) return { success: false, error: "Unauthorized" };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };
  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  const allowed = ALLOWED_TRANSITIONS[newStatus];
  if (!allowed?.includes(appointment.status)) {
    return { success: false, error: `Cannot change from ${appointment.status} to ${newStatus}` };
  }

  const now = new Date().toISOString();
  const updateFields: Record<string, unknown> = { status: newStatus, updated_at: now };
  if (newStatus === "cancelled") {
    updateFields.cancelled_at = now;
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateFields)
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  return { success: true, status: newStatus };
}
