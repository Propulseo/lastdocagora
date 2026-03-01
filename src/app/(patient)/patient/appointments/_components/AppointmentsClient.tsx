"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Stethoscope, FileText, Star } from "lucide-react"
import { format } from "date-fns"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { CancelDialog } from "./cancel-dialog"
import { RatingDialog } from "./rating-dialog"
import { usePatientTranslations } from "@/locales/locale-context"
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

export function AppointmentsClient({
  upcoming,
  past,
  cancelled,
  ratedIds,
}: AppointmentsClientProps) {
  const { t, dateLocale } = usePatientTranslations()
  const ratedSet = new Set(ratedIds)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.appointments.title}
        description={t.appointments.description}
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            {t.appointments.tabUpcoming} ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            {t.appointments.tabPast} ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            {t.appointments.tabCancelled} ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="upcoming" t={t} dateLocale={dateLocale} />
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
            <div className="space-y-4">
              {past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  type="past"
                  hasRating={ratedSet.has(appt.id)}
                  t={t}
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
            <div className="space-y-4">
              {cancelled.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="cancelled" t={t} dateLocale={dateLocale} />
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

function AppointmentCard({
  appointment: appt,
  type,
  hasRating,
  t,
  dateLocale,
}: {
  appointment: Appointment
  type: "upcoming" | "past" | "cancelled"
  hasRating?: boolean
  t: PatientTranslations
  dateLocale: DateFnsLocale
}) {
  const profName = getProfessionalName(appt.professionals)
  const profInitials = getProfessionalInitials(appt.professionals)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <Avatar size="lg" className="hidden sm:flex">
            <AvatarFallback>{profInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{profName}</h3>
              <StatusBadge type="appointment" value={appt.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {format(new Date(appt.appointment_date), t.appointments.dateFormat, {
                  locale: dateLocale,
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {appt.appointment_time?.slice(0, 5)}
                {appt.duration_minutes && ` (${appt.duration_minutes} min)`}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {appt.professionals?.specialty && (
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="size-4" />
                  {appt.professionals.specialty}
                </span>
              )}
              {appt.services?.name && (
                <span className="flex items-center gap-1.5">
                  <FileText className="size-4" />
                  {appt.services.name}
                </span>
              )}
            </div>
            {appt.cancellation_reason && (
              <p className="text-sm text-destructive">
                {t.appointments.reason.replace("{reason}", appt.cancellation_reason)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
              {t.ratingDialog.rated}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
