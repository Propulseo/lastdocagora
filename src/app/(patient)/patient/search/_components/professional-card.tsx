"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Star, Clock } from "lucide-react"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import type { PatientTranslations } from "@/locales/patient"

export type ProfessionalResult = {
  id: string
  specialty: string | null
  city: string | null
  rating: number | null
  total_reviews: number | null
  bio: string | null
  nextSlot: string | null
  users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null
}

function formatSlotDate(slot: string, locale: string): string {
  try {
    const date = new Date(slot)
    return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "pt-PT", {
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
  const profData = prof as {
    specialty?: string | null
    users?: { first_name?: string | null; last_name?: string | null } | null
  }

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 pt-6">
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getProfessionalInitials(profData)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {getProfessionalName(profData)}
            </p>
            <Badge variant="secondary" className="mt-1">
              {prof.specialty}
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
          {prof.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{prof.city}</span>
            </div>
          )}
          {prof.nextSlot && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Clock className="size-4 shrink-0" />
              <span>
                {t.nextSlot.replace(
                  "{slot}",
                  formatSlotDate(prof.nextSlot, locale)
                )}
              </span>
            </div>
          )}
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
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/patient/search/${prof.id}#booking`}>{t.book}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
