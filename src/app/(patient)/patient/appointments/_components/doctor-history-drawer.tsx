"use client"

import { format } from "date-fns"
import { Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/shared/responsive-dialog"
import { Badge } from "@/components/ui/badge"
import { getProfessionalName } from "@/app/(patient)/_components/professional-name"
import type { PatientTranslations, DateFnsLocale } from "@/locales/patient"
import type { VisitedDoctor, PastAppointmentDetail } from "./visited-doctors-types"

interface DoctorHistoryDrawerProps {
  doctor: VisitedDoctor | null
  appointments: PastAppointmentDetail[]
  open: boolean
  onOpenChange: (open: boolean) => void
  t: PatientTranslations
  locale?: string
  dateLocale: DateFnsLocale
}

const statusStyles: Record<string, string> = {
  completed: "bg-muted text-muted-foreground",
  "no-show": "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  no_show: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
}

export function DoctorHistoryDrawer({
  doctor,
  appointments,
  open,
  onOpenChange,
  t,
  dateLocale,
}: DoctorHistoryDrawerProps) {
  if (!doctor) return null

  const profData = {
    specialty: doctor.specialty,
    users: { first_name: doctor.first_name, last_name: doctor.last_name },
  }
  const profName = getProfessionalName(profData, t.professional)

  const statusLabels: Record<string, string> = {
    confirmed: t.status.confirmed,
    pending: t.status.pending,
    cancelled: t.status.cancelled,
    completed: t.status.completed,
    rejected: t.status.rejected,
    no_show: t.status.noShow,
    "no-show": t.status.noShow,
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg p-6 max-h-[85vh] flex flex-col">
        <ResponsiveDialogHeader className="shrink-0">
          <ResponsiveDialogTitle>
            {t.appointments.visitedDoctors.historyTitle.replace("{name}", profName)}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {appointments.length === 1
              ? t.appointments.visitedDoctors.consultationSingular
              : t.appointments.visitedDoctors.consultations.replace(
                  "{count}",
                  String(appointments.length)
                )}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-4 -mx-6 flex-1 overflow-y-auto">
          <div className="space-y-2 px-6 pb-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Calendar className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {format(
                      new Date(appt.appointment_date),
                      t.appointments.dateFormat,
                      { locale: dateLocale }
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {appt.appointment_time?.slice(0, 5)}
                    </span>
                    {appt.duration_minutes && (
                      <span>· {appt.duration_minutes} min</span>
                    )}
                    {appt.service_name && (
                      <span className="truncate">· {appt.service_name}</span>
                    )}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-[11px]",
                    statusStyles[appt.status]
                  )}
                >
                  {statusLabels[appt.status] ?? appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
