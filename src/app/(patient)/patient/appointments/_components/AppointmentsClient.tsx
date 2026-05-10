"use client"

import { useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { usePatientTranslations } from "@/locales/locale-context"
import { AppointmentCard, isAppointmentPast, type Appointment } from "./appointment-card"
import { VisitedDoctorCard } from "./visited-doctor-card"
import { DoctorHistoryDrawer } from "./doctor-history-drawer"
import type { VisitedDoctor, PastAppointmentDetail } from "./visited-doctors-types"

type AlternativeProposal = { proposedDate: string; proposedTime: string }

interface AppointmentsClientProps {
  active: Appointment[]
  cancelled: Appointment[]
  ratedIds?: string[]
  alternativeProposals?: Record<string, AlternativeProposal>
  visitedDoctors?: VisitedDoctor[]
  pastDetails?: Record<string, PastAppointmentDetail[]>
}

const tabTriggerClass =
  "data-[state=active]:text-primary after:bg-primary gap-2 min-h-[44px]"

export function AppointmentsClient({
  active,
  cancelled,
  alternativeProposals = {},
  visitedDoctors = [],
  pastDetails = {},
}: AppointmentsClientProps) {
  const { t, locale, dateLocale } = usePatientTranslations()
  const [historyDoctorId, setHistoryDoctorId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const openHistory = useCallback((doctorId: string) => {
    setHistoryDoctorId(doctorId)
    setHistoryOpen(true)
  }, [])

  const selectedDoctor = historyDoctorId
    ? visitedDoctors.find((d) => d.professional_id === historyDoctorId) ?? null
    : null
  const selectedAppointments = historyDoctorId
    ? pastDetails[historyDoctorId] ?? []
    : []

  const upcoming = useMemo(() => {
    const up: Appointment[] = []
    for (const appt of active) {
      if (!isAppointmentPast(appt)) {
        up.push(appt)
      }
    }
    return up
  }, [active])

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
              {visitedDoctors.length}
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
          {visitedDoctors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visitedDoctors.map((doctor) => (
                <VisitedDoctorCard
                  key={doctor.professional_id}
                  doctor={doctor}
                  onOpenHistory={openHistory}
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
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  type="cancelled"
                  alternativeProposal={alternativeProposals[appt.id]}
                  t={t}
                  locale={locale}
                  dateLocale={dateLocale}
                />
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

      <DoctorHistoryDrawer
        doctor={selectedDoctor}
        appointments={selectedAppointments}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        t={t}
        locale={locale}
        dateLocale={dateLocale}
      />
    </div>
  )
}
