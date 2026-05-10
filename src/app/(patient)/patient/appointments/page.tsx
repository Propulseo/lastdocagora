import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { getLocale } from "@/locales/patient"
import { getServiceName } from "@/lib/get-service-name"
import { AppointmentsClient } from "./_components/AppointmentsClient"
import type { VisitedDoctor, PastAppointmentDetail } from "./_components/visited-doctors-types"

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

const pastSelectFields = `id, appointment_date, appointment_time, status, duration_minutes, professional_id, professionals!appointments_professional_id_fkey ( specialty, address, city, users!professionals_user_id_fkey ( first_name, last_name, avatar_url ) ), services ( name, name_pt, name_fr, name_en )`

export default async function AppointmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const locale = await getLocale()
  const supabase = await createClient()

  const [activeRes, cancelledRes, pastRes] = await Promise.all([
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
    supabase
      .from("appointments")
      .select(pastSelectFields)
      .eq("patient_user_id", user.id)
      .in("status", ["completed", "no-show"])
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .limit(200),
  ])

  const active = (activeRes.data ?? []) as Appointment[]
  const cancelled = (cancelledRes.data ?? []) as Appointment[]

  // Build visited doctors (deduplicated) + detail map
  type PastRow = {
    id: string; appointment_date: string; appointment_time: string
    status: string; duration_minutes: number | null; professional_id: string
    professionals: {
      specialty: string | null; address: string | null; city: string | null
      users: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null
    } | null
    services: { name: string | null; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null
  }
  const pastRows = (pastRes.data ?? []) as PastRow[]

  const doctorMap = new Map<string, VisitedDoctor>()
  const detailMap = new Map<string, PastAppointmentDetail[]>()

  for (const row of pastRows) {
    const pid = row.professional_id
    if (!doctorMap.has(pid)) {
      doctorMap.set(pid, {
        professional_id: pid,
        first_name: row.professionals?.users?.first_name ?? null,
        last_name: row.professionals?.users?.last_name ?? null,
        avatar_url: row.professionals?.users?.avatar_url ?? null,
        specialty: row.professionals?.specialty ?? null,
        address: row.professionals?.address ?? null,
        city: row.professionals?.city ?? null,
        consultation_count: 0,
        last_visit_date: row.appointment_date,
      })
    }
    const doc = doctorMap.get(pid)!
    doc.consultation_count++
    if (row.appointment_date > doc.last_visit_date) {
      doc.last_visit_date = row.appointment_date
    }

    const svc = row.services
    const serviceName = svc ? getServiceName(svc, locale) || null : null

    if (!detailMap.has(pid)) detailMap.set(pid, [])
    detailMap.get(pid)!.push({
      id: row.id,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      status: row.status,
      duration_minutes: row.duration_minutes,
      service_name: serviceName,
    })
  }

  const visitedDoctors = Array.from(doctorMap.values()).sort(
    (a, b) => b.last_visit_date.localeCompare(a.last_visit_date)
  )
  const pastDetails: Record<string, PastAppointmentDetail[]> = Object.fromEntries(detailMap)

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
      visitedDoctors={visitedDoctors}
      pastDetails={pastDetails}
    />
  )
}
