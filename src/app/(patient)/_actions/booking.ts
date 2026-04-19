"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BookingService = {
  id: string
  name: string
  name_pt?: string | null
  name_fr?: string | null
  name_en?: string | null
  description: string | null
  duration_minutes: number
  price: number
  consultation_type: string
}

export type BookingAvailability = {
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean | null
  specific_date: string | null
}

type PatientInsurance = {
  name: string
  number: string | null
} | null

type BookingDataSuccess = {
  success: true
  data: {
    services: BookingService[]
    availability: BookingAvailability[]
    patientId: string
    patientUserId: string
    professionalUserId: string
    patientInsurance: PatientInsurance
  }
}

type BookingDataError = { success: false; error: string }

export async function getBookingData(
  professionalId: string
): Promise<BookingDataSuccess | BookingDataError> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "not_authenticated" }

  const [servicesRes, availRes, patientRes, proRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, name_pt, name_fr, name_en, description, duration_minutes, price, consultation_type")
      .eq("professional_id", professionalId)
      .eq("is_active", true),
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, is_recurring, specific_date")
      .eq("professional_id", professionalId)
      .neq("is_blocked", true),
    supabase
      .from("patients")
      .select("id, insurance_provider_id, insurance_number")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("professionals")
      .select("user_id")
      .eq("id", professionalId)
      .single(),
  ])

  if (!patientRes.data) return { success: false, error: "patient_not_found" }
  if (!proRes.data) return { success: false, error: "professional_not_found" }

  // Prevent self-booking: a professional cannot book themselves
  if (user.id === proRes.data.user_id) {
    return { success: false, error: "self_booking_not_allowed" }
  }

  // Fetch patient insurance provider name
  let patientInsurance: PatientInsurance = null
  if (patientRes.data.insurance_provider_id) {
    const { data: providerRow } = await supabase
      .from("insurance_providers")
      .select("name")
      .eq("id", patientRes.data.insurance_provider_id)
      .single()
    if (providerRow) {
      patientInsurance = {
        name: providerRow.name,
        number: patientRes.data.insurance_number ?? null,
      }
    }
  }

  return {
    success: true,
    data: {
      services: (servicesRes.data ?? []) as BookingService[],
      availability: (availRes.data ?? []) as BookingAvailability[],
      patientId: patientRes.data.id,
      patientUserId: user.id,
      professionalUserId: proRes.data.user_id,
      patientInsurance,
    },
  }
}

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
    .select("user_id")
    .eq("id", input.professionalId)
    .single()
  if (!pro) return { success: false, error: "professional_not_found" }

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

/* ─── Accept alternative time proposed by pro ─── */

export async function acceptAlternativeTime(
  appointmentId: string,
): Promise<{ success: true; newAppointmentId: string } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "not_authenticated" }

  // Load original appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, patient_id, patient_user_id, professional_id, professional_user_id, service_id")
    .eq("id", appointmentId)
    .single()

  if (!appointment) return { success: false, error: "appointment_not_found" }
  if (appointment.patient_user_id !== user.id) return { success: false, error: "not_your_appointment" }
  if (appointment.status !== "rejected") return { success: false, error: "invalid_status" }
  if (!appointment.patient_id || !appointment.professional_id || !appointment.professional_user_id) {
    return { success: false, error: "invalid_appointment_data" }
  }

  // Load the alternative_proposed notification to get proposed date/time
  const { data: notification } = await supabase
    .from("notifications")
    .select("id, params")
    .eq("related_id", appointmentId)
    .eq("type", "alternative_proposed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!notification) return { success: false, error: "no_proposal_found" }

  const params = notification.params as { proposedDate?: string; proposedTime?: string; dateTime?: string } | null
  let proposedDate: string | undefined
  let proposedTime: string | undefined

  if (params?.proposedDate && params?.proposedTime) {
    proposedDate = params.proposedDate
    proposedTime = params.proposedTime
  } else if (params?.dateTime) {
    // Legacy format: "2026-04-20 14:00"
    const parts = params.dateTime.split(" ")
    proposedDate = parts[0]
    proposedTime = parts[1]
  }

  if (!proposedDate || !proposedTime) return { success: false, error: "invalid_proposal_data" }

  // Load service for duration/price
  if (!appointment.service_id) return { success: false, error: "service_not_found" }
  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, price, consultation_type")
    .eq("id", appointment.service_id)
    .single()

  if (!service) return { success: false, error: "service_not_found" }

  // Book at proposed time via atomic RPC
  const timeStr = proposedTime.length === 5 ? `${proposedTime}:00` : proposedTime
  const { data: newId, error: rpcError } = await supabase.rpc("book_appointment_atomic", {
    p_patient_id: appointment.patient_id,
    p_patient_user_id: user.id,
    p_professional_id: appointment.professional_id,
    p_professional_user_id: appointment.professional_user_id,
    p_service_id: service.id,
    p_appointment_date: proposedDate,
    p_appointment_time: timeStr,
    p_duration_minutes: service.duration_minutes,
    p_price: service.price,
    p_consultation_type: service.consultation_type,
    p_notes: undefined,
    p_created_via: "patient_booking",
  })

  if (rpcError) {
    if (rpcError.message.includes("SLOT_UNAVAILABLE") || rpcError.message.includes("PATIENT_SLOT_CONFLICT")) {
      return { success: false, error: "ALTERNATIVE_EXPIRED" }
    }
    return { success: false, error: "insert_failed" }
  }

  // Mark notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notification.id)

  // Notify professional that alternative was accepted
  const { data: patientUser } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()
  const patientName = patientUser
    ? `${patientUser.first_name ?? ""} ${patientUser.last_name ?? ""}`.trim() || "Patient"
    : "Patient"

  await supabase.from("notifications").insert({
    user_id: appointment.professional_user_id,
    title: "Alternative accepted",
    message: `${patientName} accepted the proposed time: ${proposedDate} ${proposedTime}.`,
    type: "alternative_accepted",
    related_id: newId as string,
    params: { patientName, proposedDate, proposedTime },
  })

  revalidatePath("/patient/appointments")
  revalidatePath("/pro/agenda")

  return { success: true, newAppointmentId: newId as string }
}

/* ─── Decline alternative time proposed by pro ─── */

export async function declineAlternativeTime(
  appointmentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "not_authenticated" }

  // Load original appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, patient_user_id, professional_user_id")
    .eq("id", appointmentId)
    .single()

  if (!appointment) return { success: false, error: "appointment_not_found" }
  if (appointment.patient_user_id !== user.id) return { success: false, error: "not_your_appointment" }
  if (appointment.status !== "rejected") return { success: false, error: "invalid_status" }

  // Load the alternative_proposed notification
  const { data: notification } = await supabase
    .from("notifications")
    .select("id")
    .eq("related_id", appointmentId)
    .eq("type", "alternative_proposed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!notification) return { success: false, error: "no_proposal_found" }

  // Mark notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notification.id)

  // Notify professional that alternative was declined
  const { data: patientUser } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()
  const patientName = patientUser
    ? `${patientUser.first_name ?? ""} ${patientUser.last_name ?? ""}`.trim() || "Patient"
    : "Patient"

  await supabase.from("notifications").insert({
    user_id: appointment.professional_user_id,
    title: "Alternative declined",
    message: `${patientName} declined the proposed alternative time.`,
    type: "alternative_declined",
    related_id: appointmentId,
    params: { patientName },
  })

  revalidatePath("/patient/appointments")

  return { success: true }
}

/* ─── Cancel appointment by patient ─── */

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

  // Notify professional
  try {
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: appointment.professional_user_id,
      title: `Appointment cancelled by ${patientName}`,
      message: reason
        ? `${patientName} cancelled their appointment. Reason: ${reason}`
        : `${patientName} cancelled their appointment.`,
      type: "patient_cancelled",
      related_id: appointmentId,
      params: { patientName, reason: reason || null },
    })
    if (notifError) {
      console.error("[booking] Failed to insert cancellation notification:", notifError.message)
    }
  } catch (notifErr) {
    console.error("[booking] Notification insert error:", notifErr)
  }

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

  revalidatePath("/patient/appointments")
  revalidatePath("/pro/agenda")

  return { success: true }
}
