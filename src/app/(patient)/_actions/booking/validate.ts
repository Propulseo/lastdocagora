"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  BookingService,
  BookingAvailability,
  PatientInsurance,
  BookingDataSuccess,
  BookingDataError,
} from "./types"

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
      .select("user_id, verification_status")
      .eq("id", professionalId)
      .single(),
  ])

  if (!patientRes.data) return { success: false, error: "patient_not_found" }
  if (!proRes.data) return { success: false, error: "professional_not_found" }

  // Block booking with non-verified professionals
  if (proRes.data.verification_status !== "verified") {
    return { success: false, error: "professional_unavailable" }
  }

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
