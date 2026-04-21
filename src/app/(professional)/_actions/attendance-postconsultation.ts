"use server";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentActionResult } from "./attendance-validation";
import { createNotification } from "@/lib/notifications";
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  notifyPatient: boolean,
): Promise<AppointmentActionResult> {
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
    .select("id, status, professional_user_id, appointment_date, appointment_time")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };
  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: `Cannot cancel from ${appointment.status}` };
  }

  if (new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) <= new Date()) {
    return { success: false, error: "CANNOT_CANCEL_PAST" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: user.id,
      cancellation_reason: reason,
      cancellation_notify_patient: notifyPatient,
      updated_at: now,
    })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  if (notifyPatient) {
    // Fetch patient user_id and professional name for notification
    const { data: apptDetails } = await supabase
      .from("appointments")
      .select("patient_user_id, professionals!appointments_professional_id_fkey(users!professionals_user_id_fkey(first_name, last_name))")
      .eq("id", appointmentId)
      .single();

    const patientUserId = apptDetails?.patient_user_id;
    const pro = (apptDetails?.professionals as { users?: { first_name?: string; last_name?: string } } | null)?.users;
    const proName = pro ? `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() || "Professional" : "Professional";

    if (patientUserId) {
      // In-app notification to patient
      createNotification({
        userId: patientUserId,
        type: "appointment",
        title: "Consulta cancelada",
        message: `${proName} cancelou a sua consulta.`,
        link: "/patient/appointments",
      })

      // Send email notification to patient
      try {
        const { data: patientUser } = await supabase
          .from("users")
          .select("email")
          .eq("id", patientUserId)
          .single();
        const { data: patientSettings } = await supabase
          .from("patient_settings")
          .select("email_notifications")
          .eq("user_id", patientUserId)
          .single();

        if (patientUser?.email && patientSettings?.email_notifications !== false) {
          const { sendNotificationEmail } = await import("@/lib/email/resend");
          const { appointmentCancelledEmail } = await import("@/lib/email/templates");
          const template = appointmentCancelledEmail(proName, reason);
          await sendNotificationEmail({ to: patientUser.email, ...template });
        }
      } catch (emailError) {
        console.error("[cancelAppointment] Failed to send email:", emailError);
      }
    }
  }

  return { success: true, status: "cancelled" };
}
export async function rejectAppointment(
  appointmentId: string,
  reason: string,
  notifyPatient: boolean,
): Promise<AppointmentActionResult> {
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

  if (appointment.status !== "pending") {
    return { success: false, error: `Cannot reject from ${appointment.status}` };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "rejected",
      rejection_reason: reason,
      decided_at: now,
      decided_by: user.id,
      cancellation_notify_patient: notifyPatient,
      updated_at: now,
    })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  if (notifyPatient) {
    const { data: apptDetails } = await supabase
      .from("appointments")
      .select("patient_user_id, professionals!appointments_professional_id_fkey(users!professionals_user_id_fkey(first_name, last_name))")
      .eq("id", appointmentId)
      .single();

    const patientUserId = apptDetails?.patient_user_id;
    const pro = (apptDetails?.professionals as { users?: { first_name?: string; last_name?: string } } | null)?.users;
    const proName = pro ? `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() || "Professional" : "Professional";

    if (patientUserId) {
      // In-app notification to patient
      createNotification({
        userId: patientUserId,
        type: "appointment",
        title: "Consulta recusada",
        message: `${proName} recusou a sua consulta.`,
        link: "/patient/appointments",
      })

      // Send email notification to patient
      try {
        const { data: patientUser } = await supabase
          .from("users")
          .select("email")
          .eq("id", patientUserId)
          .single();
        const { data: patientSettings } = await supabase
          .from("patient_settings")
          .select("email_notifications")
          .eq("user_id", patientUserId)
          .single();

        if (patientUser?.email && patientSettings?.email_notifications !== false) {
          const { sendNotificationEmail } = await import("@/lib/email/resend");
          const { appointmentRejectedEmail } = await import("@/lib/email/templates");
          const template = appointmentRejectedEmail(proName, reason);
          await sendNotificationEmail({ to: patientUser.email, ...template });
        }
      } catch (emailError) {
        console.error("[rejectAppointment] Failed to send email:", emailError);
      }
    }
  }

  return { success: true, status: "rejected" };
}
