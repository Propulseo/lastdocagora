"use server";

import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types";
import type { MarkAttendanceResult, SaveNotesResult } from "./attendance-validation";
import { VALID_STATUSES, deriveAppointmentStatus } from "./attendance-validation";

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
    .select("id, professional_id, professional_user_id, patient_id, status, appointment_date, appointment_time")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };

  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  // Lock: once marked "present", attendance cannot be changed
  if (status !== "present") {
    const { data: existing } = await supabase
      .from("appointment_attendance")
      .select("status")
      .eq("appointment_id", appointmentId)
      .single();
    if (existing?.status === "present") {
      return { success: false, error: "ATTENDANCE_LOCKED_PRESENT" };
    }
  }

  // Guard: cannot mark absent or late before 15 min after appointment start
  if ((status === "absent" || status === "late") && appointment.appointment_date && appointment.appointment_time) {
    const [year, month, day] = appointment.appointment_date.split("-").map(Number);
    const [h, m] = (appointment.appointment_time ?? "00:00").split(":").map(Number);
    const start = new Date(year, month - 1, day, h, m);
    const threshold = new Date(start.getTime() + 15 * 60 * 1000);
    if (new Date() < threshold) {
      return { success: false, error: status === "absent" ? "ABSENT_TOO_EARLY" : "LATE_TOO_EARLY" };
    }
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

  // Update patient attendance aggregates
  if (appointment.patient_id) {
    if (status === "present") {
      await supabase
        .from("patients")
        .update({ last_visit_at: now })
        .eq("id", appointment.patient_id);
    } else if (status === "absent") {
      const { data: patientRow } = await supabase
        .from("patients")
        .select("absence_count")
        .eq("id", appointment.patient_id)
        .single();
      const currentCount = patientRow?.absence_count ?? 0;
      await supabase
        .from("patients")
        .update({ absence_count: currentCount + 1 })
        .eq("id", appointment.patient_id);
    }
  }

  return { success: true, data, appointmentStatus: newAppointmentStatus };
}

/* ─── Save appointment notes (pro action) ─── */

export async function saveAppointmentNotes(
  appointmentId: string,
  notes: string,
): Promise<SaveNotesResult> {
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
    .select("id, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };
  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
