"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Star, Clock, Loader2, Euro, Globe, Shield, Briefcase, CalendarCheck } from "lucide-react"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { fetchNextSlot } from "@/app/(patient)/_actions/ai-search"
import { BookingModal } from "./booking-modal"
import { usePatientTranslations } from "@/locales/locale-context"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations } from "@/locales/patient"

export type ProfessionalResult = {
  id: string
  specialty: string | null
  subspecialties: string[] | null
  city: string | null
  neighborhood: string | null
  address: string | null
  postal_code: string | null
  cabinet_name: string | null
  consultation_fee: number | null
  languages_spoken: string[] | null
  insurances_accepted: string[] | null
  third_party_payment: boolean | null
  years_experience: number | null
  practice_type: string | null
  rating: number | null
  total_reviews: number | null
  bio: string | null
  accessibility_options: Record<string, unknown> | null
  nextSlot: string | null
  users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null
  available_slots?: string[]
  requested_date?: string
}

const LANG_CODE_TO_LABEL: Record<string, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
}

function formatSlotDate(slot: string, locale: string): string {
  try {
    const date = new Date(slot)
    const localeMap: Record<string, string> = { fr: "fr-FR", pt: "pt-PT", en: "en-US" }
    return date.toLocaleDateString(localeMap[locale] ?? "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return slot
  }
}

export function ProfessionalCard({
  prof,
  locale,
  t,
}: {
  prof: ProfessionalResult
  locale: string
  t: PatientTranslations["search"]
}) {
  const hasAvailableSlots = prof.available_slots && prof.available_slots.length > 0
  const [nextSlot, setNextSlot] = useState<string | null>(prof.nextSlot)
  const [loadingSlot, setLoadingSlot] = useState(!prof.nextSlot && !hasAvailableSlots)

  // Skip lazy-load when available_slots is already present (date-filtered search)
  useEffect(() => {
    if (prof.nextSlot || hasAvailableSlots) return
    let cancelled = false
    fetchNextSlot(prof.id).then((slot) => {
      if (!cancelled) {
        setNextSlot(slot)
        setLoadingSlot(false)
      }
    }).catch(() => {
      if (!cancelled) setLoadingSlot(false)
    })
    return () => { cancelled = true }
  }, [prof.id, prof.nextSlot, hasAvailableSlots])

  const [bookingOpen, setBookingOpen] = useState(false)
  const { t: fullT } = usePatientTranslations()

  const profData = prof as {
    specialty?: string | null
    users?: { first_name?: string | null; last_name?: string | null } | null
  }

  const profName = getProfessionalName(profData, fullT.professional)

  return (
    <>
      <Card className="flex flex-col transition-shadow hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-4 pt-6">
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getProfessionalInitials(profData, fullT.professional)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{profName}</p>
              <Badge variant="secondary" className="mt-1">
                {translateSpecialty(prof.specialty, locale)}
              </Badge>
            </div>
            {prof.rating != null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{prof.rating.toFixed(1)}</span>
                {prof.total_reviews != null && (
                  <span className="text-muted-foreground">
                    ({prof.total_reviews})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {(prof.city || prof.neighborhood) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary/60" />
                <span>
                  {[prof.neighborhood, prof.city].filter(Boolean).join(", ")}
                  {prof.cabinet_name && ` — ${prof.cabinet_name}`}
                </span>
              </div>
            )}
            {prof.consultation_fee != null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Euro className="size-4 shrink-0 text-primary/60" />
                <span>{prof.consultation_fee}€</span>
                {prof.third_party_payment && (
                  <Badge variant="outline" className="ml-1 text-xs">Tiers payant</Badge>
                )}
              </div>
            )}
            {prof.languages_spoken && prof.languages_spoken.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="size-4 shrink-0 text-primary/60" />
                <span>{prof.languages_spoken.map((l) => LANG_CODE_TO_LABEL[l] ?? l).join(", ")}</span>
              </div>
            )}
            {prof.years_experience != null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="size-4 shrink-0 text-primary/60" />
                <span>{t.yearsExp.replace("{count}", String(prof.years_experience))}</span>
              </div>
            )}
            {prof.insurances_accepted && prof.insurances_accepted.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="size-4 shrink-0 text-primary/60" />
                <span>{prof.insurances_accepted.join(", ")}</span>
              </div>
            )}
            {hasAvailableSlots && prof.requested_date && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <CalendarCheck className="size-4 shrink-0" />
                  <span>{t.availableOn.replace("{date}", prof.requested_date)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pl-6">
                  {prof.available_slots!.map((slot) => (
                    <Badge key={slot} variant="outline" className="border-green-300 text-green-700 text-xs">
                      {slot}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {!hasAvailableSlots && loadingSlot ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{t.nextSlot.replace("{slot}", "...")}</span>
              </div>
            ) : !hasAvailableSlots && nextSlot ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Clock className="size-4 shrink-0" />
                <span>
                  {t.nextSlot.replace(
                    "{slot}",
                    formatSlotDate(nextSlot, locale)
                  )}
                </span>
              </div>
            ) : null}
            {prof.bio && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {prof.bio}
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/patient/search/${prof.id}`}>{t.viewProfile}</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setBookingOpen(true)}
            >
              {t.book}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        professionalId={prof.id}
        professionalName={profName}
        professionalSpecialty={prof.specialty}
      />
    </>
  )
}
