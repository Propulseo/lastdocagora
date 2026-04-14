"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star } from "lucide-react"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations } from "@/locales/patient"
import type { ProfessionalResult } from "./professional-card"

interface ProMapCardProps {
  prof: ProfessionalResult
  locale: string
  t: PatientTranslations["search"]
  labels: PatientTranslations["professional"]
  onViewProfile: () => void
  onBook: () => void
}

export function ProMapCard({ prof, locale, t, labels, onViewProfile, onBook }: ProMapCardProps) {
  const profData = prof as {
    specialty?: string | null
    users?: { first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null
  }

  const profName = getProfessionalName(profData, labels)
  const initials = getProfessionalInitials(profData, labels)

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/40 shadow-sm sm:size-20">
          {prof.users?.avatar_url ? (
            <Image
              src={prof.users.avatar_url}
              alt={profName}
              fill
              className="object-cover object-[50%_20%]"
              sizes="(min-width: 640px) 80px, 64px"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <span className="text-sm font-semibold text-muted-foreground sm:text-base">
                {initials}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{profName}</p>
          <Badge variant="secondary" className="mt-1">
            {translateSpecialty(prof.specialty, locale)}
          </Badge>
          {prof.rating != null && (
            <div className="mt-1.5 flex items-center gap-1 text-sm">
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{prof.rating.toFixed(1)}</span>
              {prof.total_reviews != null && (
                <span className="text-muted-foreground">({prof.total_reviews})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {(prof.city || prof.address) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary/60" />
          <span className="truncate">
            {[prof.address, prof.city].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="min-h-[40px] flex-1" onClick={onViewProfile}>
          {t.mapViewProfile}
        </Button>
        <Button size="sm" className="min-h-[40px] flex-1" onClick={onBook}>
          {t.mapBook}
        </Button>
      </div>
    </div>
  )
}
