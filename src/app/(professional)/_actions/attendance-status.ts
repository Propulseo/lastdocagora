"use server";

import { createClient } from "@/lib/supabase/server";
import type { AppointmentActionResult } from "./attendance-validation";
import { ALLOWED_TRANSITIONS } from "./attendance-validation";

/* ─── Confirm / Cancel appointment (pro action) ─── */

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: "confirmed" | "cancelled",
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

  const allowed = ALLOWED_TRANSITIONS[newStatus];
  if (!allowed?.includes(appointment.status)) {
    return { success: false, error: `Cannot change from ${appointment.status} to ${newStatus}` };
  }

  const now = new Date().toISOString();
  const updateFields: Record<string, unknown> = { status: newStatus, updated_at: now };
  if (newStatus === "confirmed") {
    updateFields.decided_at = now;
    updateFields.decided_by = user.id;
  }
  if (newStatus === "cancelled") {
    updateFields.cancelled_at = now;
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateFields)
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  // Notify patient about status change
  if (newStatus === "confirmed" || newStatus === "cancelled") {
    const { data: apptDetails } = await supabase
      .from("appointments")
      .select("patient_user_id, professionals!appointments_professional_id_fkey(users!professionals_user_id_fkey(first_name, last_name))")
      .eq("id", appointmentId)
      .single();

    const patientUserId = apptDetails?.patient_user_id;
    const pro = (apptDetails?.professionals as { users?: { first_name?: string; last_name?: string } } | null)?.users;
    const proName = pro ? `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() || "Professional" : "Professional";

    if (patientUserId) {
      const isConfirmed = newStatus === "confirmed";
      // Title/message are English fallbacks — frontend maps by `type` and interpolates `params`
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: patientUserId,
        title: isConfirmed ? "Appointment confirmed" : "Appointment cancelled",
        message: isConfirmed
          ? `${proName} confirmed your appointment.`
          : `${proName} cancelled your appointment.`,
        type: isConfirmed ? "appointment_confirmed" : "cancellation",
        related_id: appointmentId,
        params: { proName },
      });
      if (notifError) {
        console.error("[updateAppointmentStatus] Failed to insert notification:", notifError.message);
      }

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
          if (isConfirmed) {
            const { appointmentConfirmedEmail } = await import("@/lib/email/templates");
            const template = appointmentConfirmedEmail(proName);
            await sendNotificationEmail({ to: patientUser.email, ...template });
          } else {
            const { appointmentCancelledEmail } = await import("@/lib/email/templates");
            const template = appointmentCancelledEmail(proName);
            await sendNotificationEmail({ to: patientUser.email, ...template });
          }
        }
      } catch (emailError) {
        console.error("[updateAppointmentStatus] Failed to send email:", emailError);
      }
    }
  }

  return { success: true, status: newStatus };
}

/* ─── Propose alternative time (pro action) ─── */
export async function proposeAlternativeTime(
  appointmentId: string,
  proposedDate: string,
  proposedTime: string,
  message?: string,
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
    return { success: false, error: `Cannot propose alternative from ${appointment.status}` };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "rejected",
      rejection_reason: `Alternative time proposed: ${proposedDate} ${proposedTime}`,
      decided_at: now,
      decided_by: user.id,
      cancellation_notify_patient: true,
      updated_at: now,
    })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };

  // Always notify patient for alternative proposals
  const { data: apptDetails } = await supabase
    .from("appointments")
    .select("patient_user_id, professionals!appointments_professional_id_fkey(users!professionals_user_id_fkey(first_name, last_name))")
    .eq("id", appointmentId)
    .single();

  const patientUserId = apptDetails?.patient_user_id;
  const pro = (apptDetails?.professionals as { users?: { first_name?: string; last_name?: string } } | null)?.users;
  const proName = pro ? `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() || "Professional" : "Professional";

  if (patientUserId) {
    const dateTime = `${proposedDate} ${proposedTime}`;
    const msg = message?.trim()
      ? `${proName} proposed a new time: ${dateTime}. ${message.trim()}`
      : `${proName} proposed a new time: ${dateTime}.`;

    // Title/message are English fallbacks — frontend maps by `type` and interpolates `params`
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: patientUserId,
      title: "New time proposed",
      message: msg,
      type: "alternative_proposed",
      related_id: appointmentId,
      params: { proName, proposedDate, proposedTime, dateTime },
    });
    if (notifError) {
      console.error("[proposeAlternativeTime] Failed to insert notification:", notifError.message);
    }

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
        const { alternativeProposedEmail } = await import("@/lib/email/templates");
        const template = alternativeProposedEmail(proName, proposedDate, proposedTime);
        await sendNotificationEmail({ to: patientUser.email, ...template });
      }
    } catch (emailError) {
      console.error("[proposeAlternativeTime] Failed to send email:", emailError);
    }
  }

  return { success: true, status: "rejected" };
}
