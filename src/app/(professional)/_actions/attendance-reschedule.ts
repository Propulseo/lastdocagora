"use server";

import { createClient } from "@/lib/supabase/server";
import type { AppointmentActionResult } from "./attendance-validation";
import { sanitizeDbError } from "@/lib/errors";

/* ─── Reschedule appointment (pro action) ─── */

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
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
    .select("id, status, professional_user_id, patient_user_id, appointment_date, appointment_time")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };
  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  if (appointment.status !== "confirmed") {
    return { success: false, error: `Cannot reschedule from ${appointment.status}` };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: newDate,
      appointment_time: newTime,
      status: "pending",
      updated_at: now,
    })
    .eq("id", appointmentId);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-reschedule") };

  // Notify patient about reschedule
  const patientUserId = appointment.patient_user_id;
  if (patientUserId) {
    const { data: proUser } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();
    const proName = proUser
      ? `${proUser.first_name ?? ""} ${proUser.last_name ?? ""}`.trim() || "Professional"
      : "Professional";

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
        const { appointmentRescheduledEmail } = await import("@/lib/email/templates");
        const template = appointmentRescheduledEmail(proName, newDate, newTime);
        await sendNotificationEmail({ to: patientUser.email, ...template });
      }
    } catch (emailError) {
      console.error("[rescheduleAppointment] Failed to send email:", emailError);
    }
  }

  return { success: true, status: "pending" };
}
