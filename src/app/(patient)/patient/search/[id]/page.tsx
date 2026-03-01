import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Clock, Building2, Globe, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookingForm } from "./booking-form"
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

  const [{ data: professional }, { data: services }, { data: availability }, { data: reviews }, { data: patient }] = await Promise.all([
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
    ])

  if (!professional) redirect("/patient/search")

  const prof = professional as typeof professional & {
    users: { first_name: string; last_name: string; avatar_url: string | null }
  }
  const u = prof.users
  const fullName = `${t.professional.namePrefix} ${u.first_name} ${u.last_name}`
  const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase()

  const consultationTypeLabel = (_type: string) => {
    return t.professionalDetail.inPerson
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
        {/* Left column - Professional details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h1 className="text-xl font-bold">{fullName}</h1>
                    <Badge variant="secondary" className="mt-1">{prof.specialty}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {prof.rating != null && (
                      <span className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">
                          {prof.rating.toFixed(1)}
                        </span>
                        {prof.total_reviews != null && (
                          <span>({t.professionalDetail.reviews.replace("{count}", String(prof.total_reviews))})</span>
                        )}
                      </span>
                    )}
                    {prof.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {prof.city}
                      </span>
                    )}
                    {prof.years_experience != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {t.professionalDetail.yearsExperience.replace("{count}", String(prof.years_experience))}
                      </span>
                    )}
                    {prof.cabinet_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-4" />
                        {prof.cabinet_name}
                      </span>
                    )}
                  </div>
                  {prof.languages_spoken && prof.languages_spoken.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Globe className="size-4 text-muted-foreground" />
                      {prof.languages_spoken.map((lang) => (
                        <Badge key={lang} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  )}
                  {prof.insurances_accepted && prof.insurances_accepted.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      {prof.insurances_accepted.map((ins) => (
                        <Badge key={ins} variant="outline">{ins}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {prof.bio && (
            <Card>
              <CardHeader><CardTitle>{t.professionalDetail.about}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{prof.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {services && services.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t.professionalDetail.services}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-start justify-between rounded-lg border p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{svc.name}</p>
                        {svc.description && <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>}
                        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="size-3.5" />{svc.duration_minutes} {t.professionalDetail.min}</span>
                          <Badge variant="outline" className="text-xs">
                            {consultationTypeLabel(svc.consultation_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t.professionalDetail.reviewsTitle}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const r = review as typeof review & {
                      appointments?: { patients?: { users?: { first_name?: string; last_name?: string } | null } | null } | null
                    }
                    const rv = r.appointments?.patients?.users
                    const rvInit = rv ? `${rv.first_name?.[0] ?? ""}${rv.last_name?.[0] ?? ""}`.toUpperCase() : "?"
                    return (
                      <div key={r.id}>
                        <div className="flex items-start gap-3">
                          <Avatar size="sm">
                            <AvatarFallback className="text-xs">{rvInit}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">
                                {rv ? `${rv.first_name ?? ""} ${rv.last_name ?? ""}` : t.professionalDetail.fallbackReviewer}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`size-3 ${i < (r.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                ))}
                              </div>
                              {r.created_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(r.created_at), "d MMM yyyy", { locale: dateLocale })}
                                </span>
                              )}
                            </div>
                            {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Booking form (sticky on desktop) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <BookingForm
            professionalId={prof.id}
            professionalUserId={prof.user_id}
            patientId={patient?.id ?? ""}
            patientUserId={user.id}
            services={services ?? []}
            availability={availability ?? []}
          />
        </div>
      </div>
    </div>
  )
}
