"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Search, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { usePatientTranslations } from "@/locales/locale-context"
import { translateSpecialty } from "@/locales/patient/specialties"

type DashboardAppointment = {
  id: string
  appointment_date: string
  appointment_time: string | null
  status: string
  consultation_type: string
  professionals: {
    specialty: string | null
    users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null
  } | null
}

interface DashboardClientProps {
  firstName: string
  nextAppointment: DashboardAppointment | null
  recentAppointments: DashboardAppointment[]
}

export function DashboardClient({
  firstName,
  nextAppointment,
  recentAppointments,
}: DashboardClientProps) {
  const { t, locale, dateLocale } = usePatientTranslations()

  return (
    <div className="space-y-6">
      {/* ── Welcome Hero — full width ── */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t.dashboard.welcome.replace("{name}", firstName)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.dashboard.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/patient/search">
              <Search className="size-4" />
              {t.dashboard.searchProfessional}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/patient/appointments">
              <Calendar className="size-4" />
              {t.dashboard.viewAppointments}
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Two-column grid on desktop ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: next appointment */}
        <Card className="border-l-4 border-l-primary shadow-md lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-5 text-primary" />
              {t.dashboard.nextAppointment}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Large date display */}
                <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 px-5 py-4">
                  <span className="text-5xl font-bold leading-none text-primary">
                    {format(new Date(nextAppointment.appointment_date), "d", { locale: dateLocale })}
                  </span>
                  <span className="mt-1 text-sm font-medium uppercase text-primary/70">
                    {format(new Date(nextAppointment.appointment_date), "MMM", { locale: dateLocale })}
                  </span>
                </div>

                {/* Professional info */}
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-background shadow-sm sm:size-24">
                    {nextAppointment.professionals?.users?.avatar_url ? (
                      <Image
                        src={nextAppointment.professionals.users.avatar_url}
                        alt={getProfessionalName(nextAppointment.professionals, t.professional)}
                        fill
                        className="object-cover object-[50%_20%]"
                        sizes="(min-width: 640px) 96px, 80px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted">
                        <span className="text-xl font-semibold text-muted-foreground">
                          {getProfessionalInitials(nextAppointment.professionals, t.professional)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-lg font-semibold">
                      {getProfessionalName(nextAppointment.professionals, t.professional)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {translateSpecialty(nextAppointment.professionals?.specialty, locale) ?? t.professional.fallbackSpecialty}
                      </Badge>
                      <StatusBadge type="appointment" value={nextAppointment.status} labels={{ confirmed: t.status.confirmed, pending: t.status.pending, cancelled: t.status.cancelled, completed: t.status.completed, no_show: t.status.noShow }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>
                        {format(new Date(nextAppointment.appointment_date), "EEEE", { locale: dateLocale })}
                        {` ${t.dashboard.timePrefix} `}
                        {nextAppointment.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Calendar className="size-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t.dashboard.noAppointments}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/patient/search">
                    <Search className="size-4" />
                    {t.dashboard.bookAppointment}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: recent appointments */}
        <Card className="lg:col-span-5">
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
              <div className="divide-y">
                {recentAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href="/patient/appointments"
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/40">
                        {appt.professionals?.users?.avatar_url ? (
                          <Image
                            src={appt.professionals.users.avatar_url}
                            alt={getProfessionalName(appt.professionals, t.professional)}
                            fill
                            className="object-cover object-[50%_20%]"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-muted">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getProfessionalInitials(appt.professionals, t.professional)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {getProfessionalName(appt.professionals, t.professional)}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            {format(new Date(appt.appointment_date), "d MMM yyyy", { locale: dateLocale })}
                            {" - "}
                            {appt.appointment_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge type="appointment" value={appt.status} labels={{ confirmed: t.status.confirmed, pending: t.status.pending, cancelled: t.status.cancelled, completed: t.status.completed, no_show: t.status.noShow }} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t.dashboard.noRecentAppointments}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
