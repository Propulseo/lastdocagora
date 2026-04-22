"use server";

import { revalidatePath } from "next/cache";
import type { AppointmentStatus, AttendanceStatus } from "@/types";
import { deriveAppointmentStatus } from "@/lib/admin-guards";
import {
  getValidStatusTransitions,
  getValidAttendanceTransitions,
  isAppointmentFuture,
  canEditDateTime,
} from "@/lib/appointments";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";

export async function updateAppointmentStatusAdmin(
  appointmentId: string,
  status: AppointmentStatus
) {
  try {
    const admin = await getAdminClient();
    if (!admin) return { success: false, error: "Nao autorizado" };

    const { data: appt } = await admin.supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .single();

    if (!appt) return { success: false, error: "Appointment not found" };
    if (appt.status === status) return { success: true };

    const allowed = getValidStatusTransitions(appt.status as AppointmentStatus);
    if (!allowed.includes(status)) {
      return { success: false, error: "INVALID_TRANSITION" };
    }

    const { error } = await admin.supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateAttendanceAdmin(
  appointmentId: string,
  attendanceStatus: AttendanceStatus
) {
  try {
    const admin = await getAdminClient();
    if (!admin) return { success: false, error: "Nao autorizado" };

    const { data: appt } = await admin.supabase
      .from("appointments")
      .select("professional_id, professional_user_id, status, appointment_date, appointment_time")
      .eq("id", appointmentId)
      .single();

    if (!appt) return { success: false, error: "Appointment not found" };

    // Rule 1: cancelled/rejected → no attendance change
    if (["cancelled", "rejected"].includes(appt.status)) {
      return { success: false, error: "ATTENDANCE_CANCELLED_BLOCKED" };
    }

    // Rule 3: future appointment → no attendance
    if (isAppointmentFuture(appt.appointment_date, appt.appointment_time)) {
      return { success: false, error: "APPOINTMENT_NOT_STARTED" };
    }

    const { data: existing } = await admin.supabase
      .from("appointment_attendance")
      .select("id, status")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    // Rule 2: present is definitive — validate via transition matrix
    const currentAttendance = (existing?.status ?? "waiting") as AttendanceStatus;
    const validTransitions = getValidAttendanceTransitions(
      currentAttendance,
      appt.status as AppointmentStatus,
      appt.appointment_date,
      appt.appointment_time,
    );
    if (!validTransitions.includes(attendanceStatus)) {
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

    const newApptStatus = deriveAppointmentStatus(attendanceStatus, appt.status);
    if (newApptStatus !== appt.status) {
      const { error } = await admin.supabase
        .from("appointments")
        .update({ status: newApptStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateAppointmentDateTimeAdmin(
  appointmentId: string,
  date: string,
  time: string,
  forceConflict: boolean
) {
  try {
    const admin = await getAdminClient();
    if (!admin) return { success: false, error: "Nao autorizado" };

    const { data: appt } = await admin.supabase
      .from("appointments")
      .select("professional_id, duration_minutes, status")
      .eq("id", appointmentId)
      .single();

    if (!appt) return { success: false, error: "Appointment not found" };

    const { data: attendance } = await admin.supabase
      .from("appointment_attendance")
      .select("status")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    // Rule 8: block edit if attendance is present/absent or status is terminal
    if (!canEditDateTime(appt.status as AppointmentStatus, (attendance?.status ?? null) as AttendanceStatus | null)) {
      return { success: false, error: "APPOINTMENT_IMMUTABLE" };
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
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteAppointmentAdmin(appointmentId: string) {
  try {
    const admin = await getAdminClient();
    if (!admin) return { success: false, error: "Nao autorizado" };

    // Rule 7: block delete if patient is present
    const { data: attendance } = await admin.supabase
      .from("appointment_attendance")
      .select("status")
      .eq("appointment_id", appointmentId)
      .maybeSingle();
    if (attendance?.status === "present") {
      return { success: false, error: "DELETE_PRESENT_BLOCKED" };
    }

    const supabaseAdmin = getServiceRoleClient();

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
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
