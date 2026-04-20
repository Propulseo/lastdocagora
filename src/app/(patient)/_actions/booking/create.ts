"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createAppointment(input: {
  professionalId: string
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "not_authenticated" }

  // Get patient record
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!patient) return { success: false, error: "patient_not_found" }

  // Get professional
  const { data: pro } = await supabase
    .from("professionals")
    .select("user_id, verification_status")
    .eq("id", input.professionalId)
    .single()
  if (!pro) return { success: false, error: "professional_not_found" }

  // Block booking with non-verified professionals
  if (pro.verification_status !== "verified") {
    return { success: false, error: "professional_unavailable" }
  }

  // Self-booking check
  if (user.id === pro.user_id) {
    return { success: false, error: "self_booking_not_allowed" }
  }

  // Validate service belongs to this professional and is active
  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, price, consultation_type")
    .eq("id", input.serviceId)
    .eq("professional_id", input.professionalId)
    .eq("is_active", true)
    .single()
  if (!service) return { success: false, error: "invalid_service" }

  // Reject booking in the past
  const slotDateTime = new Date(`${input.appointmentDate}T${input.appointmentTime}`)
  if (slotDateTime.getTime() <= Date.now()) {
    return { success: false, error: "SLOT_IN_PAST" }
  }

  // Verify slot window is long enough for the service duration
  const [sH, sM] = input.appointmentTime.split(":").map(Number)
  const startMinutes = sH * 60 + sM
  const neededEnd = startMinutes + service.duration_minutes

  const { data: availSlots } = await supabase.rpc("get_available_slots", {
    p_date: input.appointmentDate,
    p_professional_id: input.professionalId,
  })

  const fitsWindow = (availSlots as { slot_start: string; slot_end: string }[] | null)?.some((s) => {
    const [wSH, wSM] = s.slot_start.split(":").map(Number)
    const [wEH, wEM] = s.slot_end.split(":").map(Number)
    return wSH * 60 + wSM <= startMinutes && wEH * 60 + wEM >= neededEnd
  })

  if (!fitsWindow) {
    return { success: false, error: "SLOT_TOO_SHORT" }
  }

  // Atomic booking via RPC — checks professional + patient overlap in one transaction
  const { data: newId, error: rpcError } = await supabase.rpc("book_appointment_atomic", {
    p_patient_id: patient.id,
    p_patient_user_id: user.id,
    p_professional_id: input.professionalId,
    p_professional_user_id: pro.user_id,
    p_service_id: service.id,
    p_appointment_date: input.appointmentDate,
    p_appointment_time: input.appointmentTime,
    p_duration_minutes: service.duration_minutes,
    p_price: service.price,
    p_consultation_type: service.consultation_type,
    p_notes: input.notes || undefined,
    p_created_via: "patient_booking",
  })

  if (rpcError) {
    if (rpcError.message.includes("SLOT_UNAVAILABLE")) {
      return { success: false, error: "SLOT_UNAVAILABLE" }
    }
    if (rpcError.message.includes("PATIENT_SLOT_CONFLICT")) {
      return { success: false, error: "PATIENT_SLOT_CONFLICT" }
    }
    return { success: false, error: "insert_failed" }
  }

  const appointmentId = newId as string

  // Fetch names for notifications
  const [{ data: patientUser }, { data: serviceData }, { data: proUser }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("services")
      .select("name")
      .eq("id", input.serviceId)
      .single(),
    supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", pro.user_id)
      .single(),
  ])

  const patientName = patientUser
    ? `${patientUser.first_name ?? ""} ${patientUser.last_name ?? ""}`.trim() || "Patient"
    : "Patient"
  const serviceName = serviceData?.name ?? "Appointment"
  const proName = proUser
    ? `${proUser.first_name ?? ""} ${proUser.last_name ?? ""}`.trim() || "Professional"
    : "Professional"

  // Insert notification for professional (persisted history)
  // Title/message are English fallbacks — frontend maps by `type` and interpolates `params`
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: pro.user_id,
    title: `New booking: ${patientName}`,
    message: `${serviceName} - ${input.appointmentDate} at ${input.appointmentTime}`,
    type: "new_booking",
    related_id: appointmentId,
    params: { patientName, serviceName, date: input.appointmentDate, time: input.appointmentTime },
  })
  if (notifError) {
    console.error("[booking] Failed to insert pro notification:", notifError.message)
  }

  // Insert notification for patient (booking confirmation)
  const { error: patientNotifError } = await supabase.from("notifications").insert({
    user_id: user.id,
    title: `Booking sent: ${serviceName}`,
    message: `${serviceName} with ${proName} on ${input.appointmentDate} at ${input.appointmentTime}`,
    type: "new_booking",
    related_id: appointmentId,
    params: { proName, serviceName, date: input.appointmentDate, time: input.appointmentTime },
  })
  if (patientNotifError) {
    console.error("[booking] Failed to insert patient notification:", patientNotifError.message)
  }

  // Send email notification to professional
  try {
    const { data: proSettings } = await supabase
      .from("professional_settings")
      .select("channel_email")
      .eq("user_id", pro.user_id)
      .single()

    if (proUser?.email && proSettings?.channel_email !== false) {
      const { sendNotificationEmail } = await import("@/lib/email/resend")
      const { newBookingEmail } = await import("@/lib/email/templates")
      const template = newBookingEmail(patientName, serviceName, input.appointmentDate, input.appointmentTime)
      await sendNotificationEmail({ to: proUser.email, ...template })
    }
  } catch (emailError) {
    console.error("[booking] Failed to send pro email:", emailError)
  }

  // Send email confirmation to patient
  try {
    const { data: patientSettings } = await supabase
      .from("patient_settings")
      .select("email_notifications")
      .eq("user_id", user.id)
      .single()

    if (patientUser?.email && patientSettings?.email_notifications !== false) {
      const { sendNotificationEmail } = await import("@/lib/email/resend")
      const { bookingConfirmationPatientEmail } = await import("@/lib/email/templates")
      const template = bookingConfirmationPatientEmail(proName, serviceName, input.appointmentDate, input.appointmentTime)
      await sendNotificationEmail({ to: patientUser.email, ...template })
    }
  } catch (emailError) {
    console.error("[booking] Failed to send patient email:", emailError)
  }

  revalidatePath("/patient/appointments")

  return { success: true }
}
