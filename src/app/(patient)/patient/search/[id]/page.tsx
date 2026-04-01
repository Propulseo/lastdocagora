import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookingForm } from "./booking-form"
import { ProfessionalDetailContent } from "./_components/ProfessionalDetailContent"
import { getLocale, getPatientTranslations, getDateLocale } from "@/locales/patient"

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const locale = await getLocale()
  const t = getPatientTranslations(locale)
  const dateLocale = getDateLocale(locale)

  const [{ data: professional }, { data: services }, { data: availability }, { data: reviews }, , { data: proInsurances }] = await Promise.all([
    supabase
      .from("professionals")
      .select(
        `id, user_id, specialty, city, rating, total_reviews, consultation_fee, bio,
         cabinet_name, years_experience, languages_spoken, insurances_accepted, address,
         verification_status,
         users!professionals_user_id_fkey ( first_name, last_name, avatar_url, email, phone )`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price, consultation_type")
      .eq("professional_id", id)
      .eq("is_active", true),
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, is_recurring, specific_date")
      .eq("professional_id", id)
      .neq("is_blocked", true),
    supabase
      .from("appointment_ratings")
      .select(
        `id, rating, comment, created_at,
         appointments!appointment_ratings_appointment_id_fkey (
           patients!appointments_patient_id_fkey (
             users!patients_user_id_fkey ( first_name, last_name )
           )
         )`
      )
      .eq("professional_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("professional_insurances")
      .select("insurance_provider_id, insurance_providers(name)")
      .eq("professional_id", id),
  ])

  if (!professional) redirect("/patient/search")

  const prof = professional as typeof professional & {
    users: { first_name: string; last_name: string; avatar_url: string | null }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/patient/search">
          <ArrowLeft className="size-4" />
          {t.professionalDetail.backToSearch}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <ProfessionalDetailContent
          prof={prof}
          services={(services ?? []) as Parameters<typeof ProfessionalDetailContent>[0]["services"]}
          reviews={(reviews ?? []) as Parameters<typeof ProfessionalDetailContent>[0]["reviews"]}
          proInsurances={(proInsurances ?? []) as Parameters<typeof ProfessionalDetailContent>[0]["proInsurances"]}
          t={t}
          locale={locale}
          dateLocale={dateLocale}
        />

        <div className="lg:sticky lg:top-6 lg:self-start">
          <BookingForm
            professionalId={prof.id}
            professionalUserId={prof.user_id}
            patientUserId={user.id}
            services={services ?? []}
            availability={availability ?? []}
          />
        </div>
      </div>
    </div>
  )
}
