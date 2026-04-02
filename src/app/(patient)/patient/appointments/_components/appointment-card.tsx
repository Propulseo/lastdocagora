"use client"

import { Star } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { CancelDialog } from "./cancel-dialog"
import { RatingDialog } from "./rating-dialog"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations, DateFnsLocale } from "@/locales/patient"

export type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  consultation_type: string
  duration_minutes: number | null
  notes: string | null
  cancellation_reason: string | null
  rejection_reason: string | null
  professional_id: string
  professional_user_id: string
  professionals: {
    specialty: string | null
    users: { first_name: string | null; last_name: string | null } | null
  } | null
  services: { name: string | null; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null
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

interface AppointmentCardProps {
  appointment: Appointment
  type: "upcoming" | "past" | "cancelled"
  hasRating?: boolean
  t: PatientTranslations
  locale: string
  dateLocale: DateFnsLocale
}

export function AppointmentCard({
  appointment: appt,
  type,
  hasRating,
  t,
  locale,
  dateLocale,
}: AppointmentCardProps) {
  const profName = getProfessionalName(appt.professionals, t.professional)
  const profInitials = getProfessionalInitials(appt.professionals, t.professional)

  const statusLabels: Record<string, string> = {
    confirmed: t.status.confirmed,
    pending: t.status.pending,
    cancelled: t.status.cancelled,
    completed: t.status.completed,
    rejected: t.status.rejected,
    no_show: t.status.noShow,
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-l-[3px] bg-card p-4 transition-shadow hover:shadow-md cursor-pointer",
        borderColors[type]
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
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
              {appt.services?.name && ` · ${(appt.services as Record<string, unknown>)[`name_${locale}`] as string ?? appt.services.name_pt ?? appt.services.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pl-[52px] lg:shrink-0 lg:pl-0">
          <div className="lg:text-right">
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

      {appt.cancellation_reason && (
        <p className="mt-2 pl-[52px] text-xs italic text-muted-foreground">
          {t.appointments.reason.replace("{reason}", appt.cancellation_reason)}
        </p>
      )}

      {appt.rejection_reason && (
        <p className="mt-2 pl-[52px] text-xs italic text-muted-foreground">
          {t.appointments.reason.replace("{reason}", appt.rejection_reason)}
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
    rejected: "bg-rose-50 text-rose-600",
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
