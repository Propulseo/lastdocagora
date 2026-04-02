"use server"

import { createClient } from "@/lib/supabase/server"

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

  // Insert appointment (select id for notification)
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patient.id,
      patient_user_id: user.id,
      professional_id: input.professionalId,
      professional_user_id: pro.user_id,
      service_id: service.id,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      duration_minutes: service.duration_minutes,
      price: service.price,
      consultation_type: service.consultation_type,
      status: "pending",
      notes: input.notes || null,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "insert_failed" }

  // Insert notification for professional (persisted history)
  const [{ data: patientUser }, { data: serviceData }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("services")
      .select("name")
      .eq("id", input.serviceId)
      .single(),
  ])

  const patientName = patientUser
    ? `${patientUser.first_name ?? ""} ${patientUser.last_name ?? ""}`.trim()
    : "Novo paciente"
  const serviceName = serviceData?.name ?? "Consulta"

  await supabase.from("notifications").insert({
    user_id: pro.user_id,
    title: `Novo agendamento: ${patientName}`,
    message: `${serviceName} - ${input.appointmentDate} às ${input.appointmentTime}`,
    type: "new_booking",
    related_id: appointment.id,
  })

  return { success: true }
}
