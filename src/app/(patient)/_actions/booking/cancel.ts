"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

const LOCKED_ATTENDANCE = ["present", "absent", "late"]

export async function cancelPatientAppointment(
  appointmentId: string,
  reason?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "not_authenticated" }

  // Load appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, patient_user_id, professional_user_id, professional_id, status, appointment_date, appointment_time, duration_minutes, appointment_attendance ( status )"
    )
    .eq("id", appointmentId)
    .single()

  if (!appointment) return { success: false, error: "appointment_not_found" }

  // Verify ownership
  if (appointment.patient_user_id !== user.id) {
    return { success: false, error: "not_your_appointment" }
  }

  // Verify cancellable status
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return { success: false, error: "invalid_status" }
  }

  // Check attendance isn't already locked
  const attStatus = (appointment.appointment_attendance as { status: string } | null)?.status
  if (attStatus && LOCKED_ATTENDANCE.includes(attStatus)) {
    return { success: false, error: "attendance_locked" }
  }

  // 30-minute guard: cannot cancel if appointment starts within 30 minutes
  const [year, month, day] = appointment.appointment_date.split("-").map(Number)
  const [h, m] = (appointment.appointment_time ?? "00:00").split(":").map(Number)
  const start = new Date(year, month - 1, day, h, m)
  if (start <= new Date(Date.now() + 30 * 60 * 1000)) {
    return { success: false, error: "too_late_to_cancel" }
  }

  // Update appointment to cancelled
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "cancelled" as const,
      cancellation_reason: reason || null,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", appointmentId)

  if (updateError) {
    console.error("[booking] Failed to cancel appointment:", updateError.message)
    return { success: false, error: "update_failed" }
  }

  // Fetch patient name for notification
  const { data: patientUser } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()

  const patientName = patientUser
    ? `${patientUser.first_name ?? ""} ${patientUser.last_name ?? ""}`.trim() || "Patient"
    : "Patient"

  // Send email to professional
  try {
    const { data: proUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", appointment.professional_user_id)
      .single()

    const { data: proSettings } = await supabase
      .from("professional_settings")
      .select("channel_email")
      .eq("user_id", appointment.professional_user_id)
      .single()

    if (proUser?.email && proSettings?.channel_email !== false) {
      const { sendNotificationEmail } = await import("@/lib/email/resend")
      const { appointmentCancelledByPatientEmail } = await import("@/lib/email/templates")
      const template = appointmentCancelledByPatientEmail(patientName, reason || undefined)
      await sendNotificationEmail({ to: proUser.email, ...template })
    }
  } catch (emailError) {
    console.error("[booking] Failed to send cancellation email to pro:", emailError)
  }

  // In-app notification to professional
  createNotification({
    userId: appointment.professional_user_id,
    type: "appointment",
    title: "Consulta cancelada pelo paciente",
    message: `${patientName} cancelou a sua consulta.`,
    link: "/pro/agenda",
  })

  revalidatePath("/patient/appointments")
  revalidatePath("/pro/agenda")

  return { success: true }
}
