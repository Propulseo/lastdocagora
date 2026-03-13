"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Star } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { CancelDialog } from "./cancel-dialog"
import { RatingDialog } from "./rating-dialog"
import { usePatientTranslations } from "@/locales/locale-context"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations } from "@/locales/patient"
import type { DateFnsLocale } from "@/locales/patient"

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  consultation_type: string
  duration_minutes: number | null
  notes: string | null
  cancellation_reason: string | null
  professional_id: string
  professional_user_id: string
  professionals: {
    specialty: string | null
    users: { first_name: string | null; last_name: string | null } | null
  } | null
  services: { name: string | null } | null
}

interface AppointmentsClientProps {
  upcoming: Appointment[]
  past: Appointment[]
  cancelled: Appointment[]
  ratedIds: string[]
}

const tabTriggerClass =
  "data-[state=active]:text-[#3da4ab] after:bg-[#3da4ab] gap-2"

export function AppointmentsClient({
  upcoming,
  past,
  cancelled,
  ratedIds,
}: AppointmentsClientProps) {
  const { t, locale, dateLocale } = usePatientTranslations()
  const ratedSet = new Set(ratedIds)

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.appointments.title}
        description={t.appointments.description}
      />

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="w-full justify-start gap-0">
          <TabsTrigger value="upcoming" className={tabTriggerClass}>
            {t.appointments.tabUpcoming}
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[11px] leading-none">
              {upcoming.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className={tabTriggerClass}>
            {t.appointments.tabPast}
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[11px] leading-none">
              {past.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className={tabTriggerClass}>
            {t.appointments.tabCancelled}
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[11px] leading-none">
              {cancelled.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="upcoming" t={t} locale={locale} dateLocale={dateLocale} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t.appointments.emptyUpcoming}
              description={t.appointments.emptyUpcomingDescription}
              action={
                <Button asChild>
                  <Link href="/patient/search">{t.appointments.bookAppointment}</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length > 0 ? (
            <div className="space-y-3">
              {past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  type="past"
                  hasRating={ratedSet.has(appt.id)}
                  t={t}
                  locale={locale}
                  dateLocale={dateLocale}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t.appointments.emptyPast}
              description={t.appointments.emptyPastDescription}
            />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {cancelled.length > 0 ? (
            <div className="space-y-3">
              {cancelled.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="cancelled" t={t} locale={locale} dateLocale={dateLocale} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t.appointments.emptyCancelled}
              description={t.appointments.emptyCancelledDescription}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const borderColors: Record<string, string> = {
  cancelled: "border-l-[#ef4444]",
  past: "border-l-[#9ca3af]",
  upcoming: "border-l-[#3da4ab]",
}

const avatarColors: Record<string, string> = {
  cancelled: "bg-red-50 text-red-600",
  past: "bg-gray-100 text-gray-500",
  upcoming: "bg-[#e8f6f7] text-[#3da4ab]",
}

function AppointmentCard({
  appointment: appt,
  type,
  hasRating,
  t,
  locale,
  dateLocale,
}: {
  appointment: Appointment
  type: "upcoming" | "past" | "cancelled"
  hasRating?: boolean
  t: PatientTranslations
  locale: string
  dateLocale: DateFnsLocale
}) {
  const profName = getProfessionalName(appt.professionals, t.professional)
  const profInitials = getProfessionalInitials(appt.professionals, t.professional)

  const statusLabels: Record<string, string> = {
    confirmed: t.status.confirmed,
    pending: t.status.pending,
    cancelled: t.status.cancelled,
    completed: t.status.completed,
    no_show: t.status.noShow,
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-l-[3px] bg-card p-4 transition-shadow hover:shadow-md cursor-pointer",
        borderColors[type]
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: avatar + professional info */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              avatarColors[type]
            )}
          >
            {profInitials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{profName}</h3>
              <StatusPill status={appt.status} labels={statusLabels} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {translateSpecialty(appt.professionals?.specialty, locale)}
              {appt.services?.name && ` · ${appt.services.name}`}
            </p>
          </div>
        </div>

        {/* Right: date/time + actions */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(appt.appointment_date), t.appointments.dateFormat, {
                locale: dateLocale,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {appt.appointment_time?.slice(0, 5)}
              {appt.duration_minutes && ` · ${appt.duration_minutes} ${t.professionalDetail.min}`}
            </p>
          </div>
          {type === "upcoming" && (
            <CancelDialog appointmentId={appt.id} professionalName={profName} />
          )}
          {type === "past" && appt.status === "completed" && !hasRating && (
            <RatingDialog
              appointmentId={appt.id}
              professionalId={appt.professional_id}
              professionalUserId={appt.professional_user_id}
              professionalName={profName}
            />
          )}
          {type === "past" && hasRating && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              {t.ratingDialog.rated}
            </span>
          )}
        </div>
      </div>

      {/* Cancellation reason */}
      {appt.cancellation_reason && (
        <p className="mt-2 pl-[52px] text-xs italic text-muted-foreground">
          {t.appointments.reason.replace("{reason}", appt.cancellation_reason)}
        </p>
      )}
    </div>
  )
}

function StatusPill({
  status,
  labels,
}: {
  status: string
  labels: Record<string, string>
}) {
  const styles: Record<string, string> = {
    confirmed: "bg-[#e8f6f7] text-[#3da4ab]",
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-50 text-red-600",
    no_show: "bg-red-50 text-red-600",
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        styles[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}
