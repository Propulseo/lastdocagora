"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/* --- Accept alternative time proposed by pro --- */

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

/* --- Decline alternative time proposed by pro --- */

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
