import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Search, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  getProfessionalName,
  getProfessionalSpecialty,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { getLocale, getPatientTranslations, getDateLocale } from "@/locales/patient"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const locale = await getLocale()
  const t = getPatientTranslations(locale)
  const dateLocale = getDateLocale(locale)

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()

  const today = new Date().toISOString().split("T")[0]
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select(
      `id, appointment_date, appointment_time, status, consultation_type,
       professionals!appointments_professional_id_fkey (
         specialty,
         users!professionals_user_id_fkey ( first_name, last_name )
       )`
    )
    .eq("patient_user_id", user.id)
    .gte("appointment_date", today)
    .in("status", ["confirmed", "pending"])
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(1)
    .single()

  const { data: recentAppointments } = await supabase
    .from("appointments")
    .select(
      `id, appointment_date, appointment_time, status, consultation_type,
       professionals!appointments_professional_id_fkey (
         specialty,
         users!professionals_user_id_fkey ( first_name, last_name )
       )`
    )
    .eq("patient_user_id", user.id)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(5)

  const firstName = profile?.first_name ?? "Paciente"

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.welcome.replace("{name}", firstName)}
        description={t.dashboard.description}
      />

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <Link href="/patient/search" className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Search className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t.dashboard.searchProfessional}</p>
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.searchDescription}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <Link href="/patient/appointments" className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Calendar className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t.dashboard.viewAppointments}</p>
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.viewAppointmentsDescription}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Appointment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              {t.dashboard.nextAppointment}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getProfessionalInitials(nextAppointment.professionals, t.professional)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {getProfessionalName(nextAppointment.professionals, t.professional)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {getProfessionalSpecialty(nextAppointment.professionals, t.professional)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {format(new Date(nextAppointment.appointment_date), "d", { locale: dateLocale })}
                    </p>
                    <p className="text-xs uppercase text-muted-foreground">
                      {format(new Date(nextAppointment.appointment_date), "MMM", { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(new Date(nextAppointment.appointment_date), "EEEE", { locale: dateLocale })}
                        {` ${t.dashboard.timePrefix} `}
                        {nextAppointment.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                    <StatusBadge type="appointment" value={nextAppointment.status} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.dashboard.noAppointments}{" "}
                <Link
                  href="/patient/search"
                  className="text-primary underline underline-offset-4"
                >
                  {t.dashboard.bookAppointment}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.dashboard.recentAppointments}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/patient/appointments">
                  {t.dashboard.viewAll}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href="/patient/appointments"
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          {getProfessionalInitials(appt.professionals, t.professional)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {getProfessionalName(appt.professionals, t.professional)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appt.appointment_date), "d MMM yyyy", { locale: dateLocale })}{" "}
                          - {appt.appointment_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge type="appointment" value={appt.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.dashboard.noRecentAppointments}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
