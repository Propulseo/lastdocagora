"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
        <Avatar size="lg" className="size-12">
          <AvatarImage
            src={prof.users?.avatar_url ?? undefined}
            alt={profName}
/>
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{profName}</p>
          <Badge variant="secondary" className="mt-1">
            {translateSpecialty(prof.specialty, locale)}
          </Badge>
        </div>
        {prof.rating != null && (
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{prof.rating.toFixed(1)}</span>
            {prof.total_reviews != null && (
              <span className="text-muted-foreground">({prof.total_reviews})</span>
            )}
          </div>
        )}
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
