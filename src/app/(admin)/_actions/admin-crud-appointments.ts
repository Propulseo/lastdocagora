"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus, AttendanceStatus } from "@/types";
import { deriveAppointmentStatus } from "@/lib/admin-guards";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";
const ADMIN_ALLOWED_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["completed", "cancelled", "no-show"],
  completed: [],
  cancelled: [],
  rejected: [],
  "no-show": [],
};

export { ADMIN_ALLOWED_TRANSITIONS };

export async function updateAppointmentStatusAdmin(
  appointmentId: string,
  status: AppointmentStatus
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Fetch current status to validate transition
  const { data: appt } = await admin.supabase
    .from("appointments")
    .select("status")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { success: false, error: "Appointment not found" };
  if (appt.status === status) return { success: true };

  const allowed = ADMIN_ALLOWED_TRANSITIONS[appt.status];
  if (!allowed || !allowed.includes(status)) {
    return { success: false, error: "INVALID_TRANSITION" };
  }

  const { error } = await admin.supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function updateAttendanceAdmin(
  appointmentId: string,
  attendanceStatus: AttendanceStatus
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Get appointment info + current status
  const { data: appt } = await admin.supabase
    .from("appointments")
    .select("professional_id, professional_user_id, status")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { success: false, error: "Appointment not found" };

  // Guard: cannot change attendance on terminal statuses
  if (["cancelled", "rejected", "no-show"].includes(appt.status)) {
    return { success: false, error: "ATTENDANCE_STATUS_INVALID" };
  }

  // Check if attendance record exists (include status for lock check)
  const { data: existing } = await admin.supabase
    .from("appointment_attendance")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  // Guard: once "present", cannot revert
  if (attendanceStatus !== "present" && existing?.status === "present") {
    return { success: false, error: "ATTENDANCE_LOCKED_PRESENT" };
  }

  if (existing) {
    const { error } = await admin.supabase
      .from("appointment_attendance")
      .update({
        status: attendanceStatus,
        marked_at: new Date().toISOString(),
        marked_by: admin.user.id,
      })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await admin.supabase
      .from("appointment_attendance")
      .insert({
        appointment_id: appointmentId,
        professional_id: appt.professional_id,
        professional_user_id: appt.professional_user_id,
        status: attendanceStatus,
        marked_at: new Date().toISOString(),
        marked_by: admin.user.id,
      });
    if (error) return { success: false, error: error.message };
  }

  // Sync appointment status based on attendance
  const newApptStatus = deriveAppointmentStatus(attendanceStatus, appt.status);
  if (newApptStatus !== appt.status) {
    await admin.supabase
      .from("appointments")
      .update({ status: newApptStatus, updated_at: new Date().toISOString() })
      .eq("id", appointmentId);
  }

  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function updateAppointmentDateTimeAdmin(
  appointmentId: string,
  date: string,
  time: string,
  forceConflict: boolean
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Fetch appointment for guards + conflict check
  const { data: appt } = await admin.supabase
    .from("appointments")
    .select("professional_id, duration_minutes, status")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { success: false, error: "Appointment not found" };

  // Guard: cannot modify date on terminal/completed appointments
  if (["completed", "cancelled", "rejected", "no-show"].includes(appt.status)) {
    return { success: false, error: "APPOINTMENT_IMMUTABLE" };
  }

  // Guard: cannot modify if patient marked present
  const { data: attendance } = await admin.supabase
    .from("appointment_attendance")
    .select("status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  if (attendance?.status === "present") {
    return { success: false, error: "ATTENDANCE_LOCKED_PRESENT" };
  }

  if (!forceConflict) {
    const { data: conflicts } = await admin.supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", appt.professional_id)
      .eq("appointment_date", date)
      .neq("id", appointmentId)
      .not("status", "in", '("cancelled","rejected")');

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: "conflict" };
    }
  }

  const { error } = await admin.supabase
    .from("appointments")
    .update({ appointment_date: date, appointment_time: time })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function deleteAppointmentAdmin(appointmentId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  // Delete related records
  await supabaseAdmin
    .from("appointment_attendance")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("appointment_notifications")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("consultation_notes")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("review_requests")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("appointment_id", appointmentId);
  await supabaseAdmin
    .from("payments")
    .delete()
    .eq("appointment_id", appointmentId);

  const { error } = await supabaseAdmin
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

