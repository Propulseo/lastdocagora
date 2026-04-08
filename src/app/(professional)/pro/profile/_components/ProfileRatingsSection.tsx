"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { fr } from "date-fns/locale/fr";
import { enGB } from "date-fns/locale/en-GB";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Professional, Rating } from "./profile-types";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

interface ProfileRatingsSectionProps {
  professional: Professional;
  recentRatings: Rating[];
}

export function ProfileRatingsSection({ professional, recentRatings }: ProfileRatingsSectionProps) {
  const { t, locale } = useProfessionalI18n();
  const dateLocale = locale === "fr" ? fr : locale === "en" ? enGB : pt;
  const reviewCount = professional.total_reviews ?? 0;
  const bioKey = `bio_${locale}` as "bio_pt" | "bio_fr" | "bio_en";
  const bio = (professional[bioKey] as string | null) ?? professional.bio_pt ?? professional.bio;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={`${RADIUS.card} ${SHADOW.card}`}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`${RADIUS.element} bg-amber-50 p-2.5`}>
              <Star className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{professional.rating?.toFixed(1) ?? "-"}</p>
              <p className="text-xs text-muted-foreground">
                {reviewCount} {reviewCount !== 1 ? t.profile.reviewPlural : t.profile.reviewSingular}
              </p>
            </div>
          </CardContent>
        </Card>
        {bio && (
          <Card className={`${RADIUS.card} ${SHADOW.card}`}>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {recentRatings.length > 0 && (
        <Card className={`${RADIUS.card} ${SHADOW.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-muted-foreground" />
              {t.profile.recentReviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRatings.map((r, idx) => {
                const patientName = r.patient_identifier ?? t.profile.patient;
                const patientInitials = r.patient_identifier ? r.patient_identifier.slice(0, 2).toUpperCase() : "P";
                return (
                  <div key={r.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{patientInitials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{patientName}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`size-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "d MMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        {r.service_name && <p className="mt-0.5 text-xs text-muted-foreground">{r.service_name}</p>}
                        {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
