"use server";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentActionResult } from "./attendance-validation";
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
    .select("id, status, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };
  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  if (!["pending", "confirmed"].includes(appointment.status)) {
    return { success: false, error: `Cannot cancel from ${appointment.status}` };
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
      // Title/message are English fallbacks — frontend maps by `type` and interpolates `params`
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: patientUserId,
        title: "Appointment cancelled",
        message: reason
          ? `${proName} cancelled your appointment. Reason: ${reason}`
          : `${proName} cancelled your appointment.`,
        type: "cancellation",
        related_id: appointmentId,
        params: { proName, reason: reason || undefined },
      });
      if (notifError) {
        console.error("[cancelAppointment] Failed to insert notification:", notifError.message);
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
          const { appointmentCancelledEmail } = await import("@/lib/email/templates");
          const template = appointmentCancelledEmail(proName, reason);
          await sendNotificationEmail({ to: patientUser.email, ...template });
        }
      } catch (emailError) {
        console.error("[cancelAppointment] Failed to send email:", emailError);
      }
    }
  }

  // Check if a payment is associated — if so, notify admin
  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, amount, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle()

  if (paymentRecord) {
    // Get all admin user IDs
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")

    if (admins && admins.length > 0) {
      const adminNotifs = admins.map((admin) => ({
        user_id: admin.id,
        title: "Payment requires attention",
        message: `Cancelled appointment has associated payment (${paymentRecord.amount}€, status: ${paymentRecord.status}).`,
        type: "payment_requires_attention",
        related_id: appointmentId,
        params: { paymentId: paymentRecord.id, amount: paymentRecord.amount, paymentStatus: paymentRecord.status },
      }))
      const { error: adminNotifError } = await supabase
        .from("notifications")
        .insert(adminNotifs)
      if (adminNotifError) {
        console.error("[cancelAppointment] Failed to notify admins about payment:", adminNotifError.message)
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
      // Title/message are English fallbacks — frontend maps by `type` and interpolates `params`
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: patientUserId,
        title: "Appointment rejected",
        message: reason
          ? `${proName} rejected your appointment request. Reason: ${reason}`
          : `${proName} rejected your appointment request.`,
        type: "appointment_rejected",
        related_id: appointmentId,
        params: { proName, reason: reason || undefined },
      });
      if (notifError) {
        console.error("[rejectAppointment] Failed to insert notification:", notifError.message);
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
