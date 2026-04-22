"use client"

import { Star, Phone } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { CancelDialog } from "./cancel-dialog"
import { RatingDialog } from "./rating-dialog"
import { AlternativeResponse } from "./alternative-response"
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
    users: { first_name: string | null; last_name: string | null; avatar_url?: string | null; phone?: string | null } | null
  } | null
  services: { name: string | null; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null
  appointment_attendance: { status: string } | null
}

const ATTENDED_STATUSES = ["present", "absent", "late"]

export function isAppointmentPast(appt: Appointment): boolean {
  if (appt.status === "completed" || appt.status === "no-show" || appt.status === "no_show") return true
  const att = appt.appointment_attendance?.status
  if (att && ATTENDED_STATUSES.includes(att)) return true
  const [year, month, day] = appt.appointment_date.split("-").map(Number)
  const [h, m] = (appt.appointment_time ?? "00:00").split(":").map(Number)
  const end = new Date(year, month - 1, day, h, m + (appt.duration_minutes ?? 30))
  return end < new Date()
}

export function canCancelAppointment(appt: Appointment): boolean {
  if (appt.status !== "pending" && appt.status !== "confirmed") return false
  const att = appt.appointment_attendance?.status
  if (att && ATTENDED_STATUSES.includes(att)) return false
  const [year, month, day] = appt.appointment_date.split("-").map(Number)
  const [h, m] = (appt.appointment_time ?? "00:00").split(":").map(Number)
  const start = new Date(year, month - 1, day, h, m)
  return start > new Date(Date.now() + 30 * 60 * 1000)
}

/** Appointment is upcoming but within the 30-min no-cancel window */
function isWithinCancelCutoff(appt: Appointment): boolean {
  if (appt.status !== "pending" && appt.status !== "confirmed") return false
  const att = appt.appointment_attendance?.status
  if (att && ATTENDED_STATUSES.includes(att)) return false
  const [year, month, day] = appt.appointment_date.split("-").map(Number)
  const [h, m] = (appt.appointment_time ?? "00:00").split(":").map(Number)
  const start = new Date(year, month - 1, day, h, m)
  const now = new Date()
  return start > now && start <= new Date(now.getTime() + 30 * 60 * 1000)
}

const borderColors: Record<string, string> = {
  cancelled: "border-l-destructive",
  past: "border-l-muted-foreground/40",
  upcoming: "border-l-primary",
}

const avatarColors: Record<string, string> = {
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  past: "bg-muted text-muted-foreground",
  upcoming: "bg-primary/10 text-primary",
}

interface AppointmentCardProps {
  appointment: Appointment
  type: "upcoming" | "past" | "cancelled"
  hasRating?: boolean
  alternativeProposal?: { proposedDate: string; proposedTime: string }
  t: PatientTranslations
  locale: string
  dateLocale: DateFnsLocale
}

export function AppointmentCard({
  appointment: appt,
  type,
  hasRating,
  alternativeProposal,
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
          <Avatar className="size-10 shrink-0">
            <AvatarImage
              src={appt.professionals?.users?.avatar_url ?? undefined}
              alt={profName}
/>
            <AvatarFallback className={cn("text-sm font-semibold", avatarColors[type])}>
              {profInitials}
            </AvatarFallback>
          </Avatar>
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
          {canCancelAppointment(appt) && (
            <CancelDialog appointmentId={appt.id} professionalName={profName} />
          )}
          {type === "upcoming" && isWithinCancelCutoff(appt) && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Phone className="size-3.5 shrink-0" />
              <span>
                {t.appointments.cancelTooLate}
                {appt.professionals?.users?.phone && (
                  <> {t.appointments.cancelTooLatePhone.replace("{phone}", appt.professionals.users.phone)}</>
                )}
              </span>
            </div>
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
          {t.appointments.reason.replace("{reason}", t.appointments.reasonLabels[appt.cancellation_reason] ?? appt.cancellation_reason)}
        </p>
      )}

      {appt.rejection_reason && (
        <p className="mt-2 pl-[52px] text-xs italic text-muted-foreground">
          {t.appointments.reason.replace("{reason}", t.appointments.reasonLabels[appt.rejection_reason] ?? appt.rejection_reason)}
        </p>
      )}

      {alternativeProposal && appt.status === "rejected" && (
        <AlternativeResponse
          appointmentId={appt.id}
          proposedDate={alternativeProposal.proposedDate}
          proposedTime={alternativeProposal.proposedTime}
        />
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
    confirmed: "bg-primary/10 text-primary",
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    rejected: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    no_show: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        styles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}
