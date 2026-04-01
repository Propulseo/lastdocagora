"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { usePatientTranslations } from "@/locales/locale-context"
import { AppointmentCard, type Appointment } from "./appointment-card"

interface AppointmentsClientProps {
  upcoming: Appointment[]
  past: Appointment[]
  cancelled: Appointment[]
  ratedIds: string[]
}

const tabTriggerClass =
  "data-[state=active]:text-[#3da4ab] after:bg-[#3da4ab] gap-2 min-h-[44px]"

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
