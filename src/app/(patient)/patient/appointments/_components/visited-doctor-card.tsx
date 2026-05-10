"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations, DateFnsLocale } from "@/locales/patient"
import type { VisitedDoctor } from "./visited-doctors-types"

interface VisitedDoctorCardProps {
  doctor: VisitedDoctor
  onOpenHistory: (doctorId: string) => void
  t: PatientTranslations
  locale: string
  dateLocale: DateFnsLocale
}

export function VisitedDoctorCard({
  doctor,
  onOpenHistory,
  t,
  locale,
  dateLocale,
}: VisitedDoctorCardProps) {
  const profData = {
    specialty: doctor.specialty,
    users: { first_name: doctor.first_name, last_name: doctor.last_name },
  }
  const profName = getProfessionalName(profData, t.professional)
  const profInitials = getProfessionalInitials(profData, t.professional)

  const address = [doctor.address, doctor.city]
    .filter(Boolean)
    .join(", ")

  const countLabel =
    doctor.consultation_count === 1
      ? t.appointments.visitedDoctors.consultationSingular
      : t.appointments.visitedDoctors.consultations.replace(
          "{count}",
          String(doctor.consultation_count)
        )

  const lastVisitLabel = t.appointments.visitedDoctors.lastVisit.replace(
    "{date}",
    format(new Date(doctor.last_visit_date), t.appointments.dateFormat, {
      locale: dateLocale,
    })
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenHistory(doctor.professional_id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpenHistory(doctor.professional_id)
        }
      }}
      className={cn(
        "group flex flex-col items-center rounded-2xl border bg-card p-5 sm:p-6 transition-all",
        "hover:shadow-lg hover:border-primary/20",
        "active:scale-[0.98] cursor-pointer"
      )}
    >
      <Avatar className="size-24 sm:size-28 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
        <AvatarImage
          src={doctor.avatar_url ?? undefined}
          alt={profName}
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary text-2xl sm:text-3xl font-semibold">
          {profInitials}
        </AvatarFallback>
      </Avatar>

      <div className="mt-4 flex flex-col items-center gap-1 text-center w-full">
        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate max-w-full">
          {profName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translateSpecialty(doctor.specialty, locale)}
        </p>

        {address ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="size-4 shrink-0 text-muted-foreground/70" />
            <span className="truncate max-w-[220px] sm:max-w-[260px]">{address}</span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground/60 mt-1">
            <MapPin className="size-4 shrink-0" />
            <span>{t.appointments.visitedDoctors.noAddress}</span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {countLabel}
          </Badge>
          <span className="text-xs text-muted-foreground/60">
            {lastVisitLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex w-full gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onOpenHistory(doctor.professional_id)
          }}
        >
          {t.appointments.visitedDoctors.viewHistory}
        </Button>
        <Button
          asChild
          size="sm"
          className="min-h-[44px] flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/patient/search/${doctor.professional_id}`}>
            {t.appointments.visitedDoctors.rebook}
          </Link>
        </Button>
      </div>
    </div>
  )
}
