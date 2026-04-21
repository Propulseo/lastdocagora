"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications"

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

  // Check if patient is blocked by this professional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: blockedCount } = await (supabase as any)
    .from("professional_blocked_patients")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", input.professionalId)
    .eq("patient_id", patient.id)
  if (blockedCount && blockedCount > 0) {
    return { success: false, error: "PATIENT_BLOCKED" }
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

  // Verify enough consecutive 30-min slots are free for the service duration
  const [sH, sM] = input.appointmentTime.split(":").map(Number)
  const startMinutes = sH * 60 + sM

  const { data: availSlots } = await supabase.rpc("get_available_slots", {
    p_date: input.appointmentDate,
    p_professional_id: input.professionalId,
  })

  const slotStarts = new Set(
    (availSlots as { slot_start: string; slot_end: string }[] | null)?.map(
      (s) => s.slot_start.slice(0, 5)
    ) ?? []
  )

  const neededSlots = Math.ceil(service.duration_minutes / 30)
  let fitsWindow = slotStarts.has(input.appointmentTime.slice(0, 5))
  if (fitsWindow) {
    for (let i = 1; i < neededSlots; i++) {
      const t = startMinutes + i * 30
      const key = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
      if (!slotStarts.has(key)) { fitsWindow = false; break }
    }
  }

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

  // Fetch names for email notifications
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

  // In-app notification to professional
  createNotification({
    userId: pro.user_id,
    type: "appointment",
    title: "Nova marcação",
    message: `${patientName} marcou ${serviceName} em ${input.appointmentDate} às ${input.appointmentTime}`,
    link: "/pro/agenda",
  })

  revalidatePath("/patient/appointments")

  return { success: true }
}
