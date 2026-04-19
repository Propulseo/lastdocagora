import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { AppointmentsClient } from "./_components/AppointmentsClient"

type Appointment = {
  id: string; appointment_date: string; appointment_time: string
  status: string; consultation_type: string; duration_minutes: number | null
  notes: string | null; cancellation_reason: string | null; rejection_reason: string | null
  professional_id: string; professional_user_id: string
  professionals: { specialty: string | null; users: { first_name: string | null; last_name: string | null; avatar_url?: string | null; phone?: string | null } | null } | null
  services: { name: string | null; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null
  appointment_attendance: { status: string } | null
}

const selectFields = `id, appointment_date, appointment_time, status, consultation_type, duration_minutes, notes, cancellation_reason, rejection_reason, professional_id, professional_user_id, professionals!appointments_professional_id_fkey ( specialty, users!professionals_user_id_fkey ( first_name, last_name, avatar_url, phone ) ), services ( name, name_pt, name_fr, name_en ), appointment_attendance ( status )`

export default async function AppointmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const [activeRes, cancelledRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .not("status", "in", '("cancelled","rejected")')
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(100),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .in("status", ["cancelled", "rejected"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ])

  const active = (activeRes.data ?? []) as Appointment[]
  const cancelled = (cancelledRes.data ?? []) as Appointment[]

  const activeIds = active.map((a) => a.id)
  const { data: ratings } = activeIds.length
    ? await supabase
        .from("appointment_ratings")
        .select("appointment_id")
        .in("appointment_id", activeIds)
    : { data: [] }

  const ratedIds = new Set((ratings ?? []).map((r) => r.appointment_id))

  // Fetch unread alternative_proposed notifications for rejected appointments
  const rejectedIds = cancelled
    .filter((a) => a.status === "rejected")
    .map((a) => a.id)

  type AlternativeProposal = { proposedDate: string; proposedTime: string }
  const alternativeProposals: Record<string, AlternativeProposal> = {}

  if (rejectedIds.length > 0) {
    const { data: altNotifs } = await supabase
      .from("notifications")
      .select("related_id, params")
      .eq("user_id", user.id)
      .eq("type", "alternative_proposed")
      .eq("is_read", false)
      .in("related_id", rejectedIds)

    for (const notif of altNotifs ?? []) {
      const p = notif.params as { proposedDate?: string; proposedTime?: string; dateTime?: string } | null
      if (!p || !notif.related_id) continue
      let pDate: string | undefined
      let pTime: string | undefined
      if (p.proposedDate && p.proposedTime) {
        pDate = p.proposedDate
        pTime = p.proposedTime
      } else if (p.dateTime) {
        const parts = p.dateTime.split(" ")
        pDate = parts[0]
        pTime = parts[1]
      }
      if (pDate && pTime) {
        alternativeProposals[notif.related_id] = { proposedDate: pDate, proposedTime: pTime }
      }
    }
  }

  return (
    <AppointmentsClient
      active={active}
      cancelled={cancelled}
      ratedIds={[...ratedIds]}
      alternativeProposals={alternativeProposals}
    />
  )
}
