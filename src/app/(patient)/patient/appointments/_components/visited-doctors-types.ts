export type VisitedDoctor = {
  professional_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  specialty: string | null
  address: string | null
  city: string | null
  consultation_count: number
  last_visit_date: string
}

export type PastAppointmentDetail = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  duration_minutes: number | null
  service_name: string | null
}
