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
  if (attendance === "absent") return "no-show";
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
    .select("id, professional_id, professional_user_id, status, appointment_date, appointment_time")
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

  return { success: true, data, appointmentStatus: newAppointmentStatus };
}

/* ─── Save appointment notes (pro action) ─── */
type SaveNotesResult =
  | { success: true }
  | { success: false; error: string };

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

/* ─── Cancel appointment with reason (pro action) ─── */
type CancelResult =
  | { success: true; status: string }
  | { success: false; error: string };

export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  notifyPatient: boolean,
): Promise<CancelResult> {
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

/* ─── Reject appointment (pro action) ─── */
type RejectResult =
  | { success: true; status: string }
  | { success: false; error: string };

export async function rejectAppointment(
  appointmentId: string,
  reason: string,
  notifyPatient: boolean,
): Promise<RejectResult> {
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

/* ─── Propose alternative time (pro action) ─── */
export async function proposeAlternativeTime(
  appointmentId: string,
  proposedDate: string,
  proposedTime: string,
  message?: string,
): Promise<RejectResult> {
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

/* ─── Confirm / Cancel appointment (pro action) ─���─ */
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

/* ─── Reschedule appointment (pro action) ─── */

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
): Promise<{ success: true; status: string } | { success: false; error: string }> {
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

  if (error) return { success: false, error: error.message };

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

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: patientUserId,
      title: "Appointment rescheduled",
      message: `${proName} rescheduled your appointment to ${newDate} at ${newTime}. Please reconfirm.`,
      type: "appointment_rescheduled",
      related_id: appointmentId,
      params: { proName, newDate, newTime },
    });
    if (notifError) {
      console.error("[rescheduleAppointment] Failed to insert notification:", notifError.message);
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
