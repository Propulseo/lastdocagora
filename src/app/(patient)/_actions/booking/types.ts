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

export type PatientInsurance = {
  name: string
  number: string | null
} | null

export type BookingDataSuccess = {
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

export type BookingDataError = { success: false; error: string }
