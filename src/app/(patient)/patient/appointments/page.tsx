import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { AppointmentsClient } from "./_components/AppointmentsClient"

type Appointment = {
  id: string; appointment_date: string; appointment_time: string
  status: string; consultation_type: string; duration_minutes: number | null
  notes: string | null; cancellation_reason: string | null; rejection_reason: string | null
  professional_id: string; professional_user_id: string
  professionals: { specialty: string | null; users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null } | null
  services: { name: string | null; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null
}

const selectFields = `id, appointment_date, appointment_time, status, consultation_type, duration_minutes, notes, cancellation_reason, rejection_reason, professional_id, professional_user_id, professionals!appointments_professional_id_fkey ( specialty, users!professionals_user_id_fkey ( first_name, last_name, avatar_url ) ), services ( name, name_pt, name_fr, name_en )`

export default async function AppointmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [upcomingRes, pastRes, cancelledRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .gte("appointment_date", today)
      .in("status", ["confirmed", "pending"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true }),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .in("status", ["completed", "no_show"])
      .order("appointment_date", { ascending: false })
      .limit(20),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .in("status", ["cancelled", "rejected"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ])

  const upcoming = (upcomingRes.data ?? []) as Appointment[]
  const past = (pastRes.data ?? []) as Appointment[]
  const cancelled = (cancelledRes.data ?? []) as Appointment[]

  // Fetch existing ratings for past appointments
  const pastIds = past.map((a) => a.id)
  const { data: ratings } = pastIds.length
    ? await supabase
        .from("appointment_ratings")
        .select("appointment_id")
        .in("appointment_id", pastIds)
    : { data: [] }

  const ratedIds = new Set((ratings ?? []).map((r) => r.appointment_id))

  return (
    <AppointmentsClient
      upcoming={upcoming}
      past={past}
      cancelled={cancelled}
      ratedIds={[...ratedIds]}
    />
  )
}
