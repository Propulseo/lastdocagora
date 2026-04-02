import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { getLocale, getPatientTranslations } from "@/locales/patient"
import { DashboardClient } from "./_components/DashboardClient"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [{ data: profile }, { data: nextAppointment }, { data: recentAppointments }] =
    await Promise.all([
      supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("appointments")
        .select(
          `id, appointment_date, appointment_time, status, consultation_type,
           professionals!appointments_professional_id_fkey (
             specialty,
             users!professionals_user_id_fkey ( first_name, last_name, avatar_url )
           )`
        )
        .eq("patient_user_id", user.id)
        .gte("appointment_date", today)
        .in("status", ["confirmed", "pending"])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(1)
        .single(),
      supabase
        .from("appointments")
        .select(
          `id, appointment_date, appointment_time, status, consultation_type,
           professionals!appointments_professional_id_fkey (
             specialty,
             users!professionals_user_id_fkey ( first_name, last_name, avatar_url )
           )`
        )
        .eq("patient_user_id", user.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
        .limit(5),
    ])

  const locale = await getLocale()
  const t = getPatientTranslations(locale)
  const firstName = profile?.first_name ?? t.common.patient

  return (
    <DashboardClient
      firstName={firstName}
      nextAppointment={nextAppointment}
      recentAppointments={recentAppointments ?? []}
    />
  )
}
