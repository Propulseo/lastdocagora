"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Euro, Globe, CalendarCheck } from "lucide-react"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { BookingModal } from "./booking-modal"
import { AvailabilityGrid } from "./AvailabilityGrid"
import { usePatientTranslations } from "@/locales/locale-context"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations } from "@/locales/patient"
import { languageLabel, languageFlag } from "@/lib/languages"
import type { ProfessionalResult } from "./professional-card"

export function ProfessionalCardHorizontal({
  prof,
  locale,
  t,
}: {
  prof: ProfessionalResult
  locale: string
  t: PatientTranslations["search"]
}) {
  const hasAvailableSlots = prof.available_slots && prof.available_slots.length > 0

  const [bookingOpen, setBookingOpen] = useState(false)
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>()
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>()
  const { t: fullT } = usePatientTranslations()

  const profData = prof as {
    specialty?: string | null
    users?: { first_name?: string | null; last_name?: string | null } | null
  }

  const profName = getProfessionalName(profData, fullT.professional)

  const bioKey = `bio_${locale}` as keyof typeof prof
  const bio = (prof[bioKey] as string | null) ?? prof.bio_pt ?? prof.bio

  return (
    <>
      <Card className="transition-all hover:shadow-md hover:border-primary/20">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Zone 1 — Identity */}
            <div className="flex gap-3 p-4 sm:w-1/4 sm:flex-col sm:items-center sm:gap-2 sm:border-r sm:border-border/50">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-background shadow-sm sm:size-36">
                {prof.users?.avatar_url ? (
                  <Image
                    src={prof.users.avatar_url}
                    alt={profName}
                    fill
                    className="object-cover object-[50%_20%]"
                    sizes="(min-width: 640px) 144px, 80px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted">
                    <span className="text-xl font-semibold text-muted-foreground sm:text-3xl">
                      {getProfessionalInitials(profData, fullT.professional)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 sm:flex-initial sm:text-center">
                <p className="truncate font-medium text-sm">{profName}</p>
                <Badge variant="secondary" className="mt-1">
                  {translateSpecialty(prof.specialty, locale)}
                </Badge>
                {prof.rating != null && (
                  <div className="mt-1.5 flex items-center gap-1 text-sm sm:justify-center">
                    <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-xs">{prof.rating.toFixed(1)}</span>
                    {prof.total_reviews != null && (
                      <span className="text-xs text-muted-foreground">
                        ({prof.total_reviews})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Zone 2 — Practical info */}
            <div className="space-y-2 border-t border-border/50 p-4 sm:w-[35%] sm:border-t-0 sm:border-r sm:border-border/50">
              {(prof.city || prof.neighborhood) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-primary/60" />
                  <span className="text-xs">
                    {[prof.neighborhood, prof.city].filter(Boolean).join(", ")}
                    {prof.cabinet_name && ` — ${prof.cabinet_name}`}
                  </span>
                </div>
              )}
              {prof.consultation_fee != null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Euro className="size-3.5 shrink-0 text-primary/60" />
                  <span className="text-xs font-medium">{prof.consultation_fee}&euro;</span>
                  {prof.third_party_payment && (
                    <Badge variant="outline" className="ml-1 text-[10px]">{t.thirdPartyPayment}</Badge>
                  )}
                </div>
              )}
              {prof.languages_spoken && prof.languages_spoken.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-3.5 shrink-0 text-primary/60" />
                  <span className="text-xs">
                    {prof.languages_spoken.map((l) => `${languageFlag(l)} ${languageLabel(l)}`).join(", ")}
                  </span>
                </div>
              )}
              {bio && (
                <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                  {bio}
                </p>
              )}
              <Link
                href={`/patient/search/${prof.id}`}
                className="inline-block text-xs text-primary hover:underline pt-1"
              >
                {t.viewProfile} &rarr;
              </Link>
            </div>

            {/* Zone 3 — Slot picker */}
            <div className="flex flex-col border-t border-border/50 p-4 sm:w-[40%] sm:border-t-0">
              <div className="flex-1">
                {hasAvailableSlots && prof.requested_date ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <CalendarCheck className="size-4 shrink-0" />
                      <span className="text-xs">{t.availableOn.replace("{date}", prof.requested_date)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prof.available_slots!.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => {
                            setPreselectedDate(prof.requested_date)
                            setPreselectedTime(slot)
                            setBookingOpen(true)
                          }}
                          className="rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700
                                     hover:bg-teal-600 hover:text-white hover:border-teal-600
                                     dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300
                                     dark:hover:bg-teal-600 dark:hover:text-white dark:hover:border-teal-600
                                     transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AvailabilityGrid
                    professionalId={prof.id}
                    locale={locale}
                    noSlotsLabel={t.noSlotsAvailable}
                    moreSlotsLabel={t.moreSlotsLink}
                    emptyActionLabel={t.notifyWhenAvailable}
                    onEmptyAction={() => setBookingOpen(true)}
                    onSlotSelect={(date, time) => {
                      setPreselectedDate(date)
                      setPreselectedTime(time)
                      setBookingOpen(true)
                    }}
                    onMoreSlots={() => setBookingOpen(true)}
                  />
                )}
              </div>

              <Button
                className="mt-3 w-full min-h-[44px] font-medium"
                onClick={() => {
                  setPreselectedDate(undefined)
                  setPreselectedTime(undefined)
                  setBookingOpen(true)
                }}
              >
                {t.book}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        professionalId={prof.id}
        professionalName={profName}
        professionalSpecialty={prof.specialty}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
      />
    </>
  )
}
