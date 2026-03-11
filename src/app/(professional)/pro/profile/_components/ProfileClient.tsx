"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  MapPin,
  Globe,
  Stethoscope,
  Star,
  MessageSquare,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { fr } from "date-fns/locale/fr";
import { enGB } from "date-fns/locale/en-GB";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  language: string | null;
}

interface Professional {
  id: string;
  specialty: string | null;
  registration_number: string | null;
  practice_type: string | null;
  cabinet_name: string | null;
  years_experience: number | null;
  subspecialties: string[] | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  languages_spoken: string[] | null;
  bio: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string | null;
}

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  appointment_date: string;
  service_name: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
}

interface ProfileClientProps {
  userProfile: UserProfile;
  professional: Professional;
  recentRatings: Rating[];
}

export function ProfileClient({
  userProfile,
  professional,
  recentRatings,
}: ProfileClientProps) {
  const { t, locale } = useProfessionalI18n();

  const dateLocale = locale === "fr" ? fr : locale === "en" ? enGB : pt;

  const initials =
    (userProfile.first_name?.[0] ?? "") + (userProfile.last_name?.[0] ?? "");

  const fields = [
    {
      section: t.profile.personalInfo,
      icon: UserCircle,
      items: [
        {
          label: t.profile.name,
          value: `${userProfile.first_name} ${userProfile.last_name}`,
        },
        { label: t.profile.email, value: userProfile.email },
        { label: t.profile.phone, value: userProfile.phone ?? t.profile.notDefined },
      ],
    },
    {
      section: t.profile.professionalInfo,
      icon: Stethoscope,
      items: [
        { label: t.profile.specialty, value: translateSpecialty(professional.specialty, locale) },
        {
          label: t.profile.registrationNumber,
          value: professional.registration_number,
        },
        {
          label: t.profile.practiceType,
          value: professional.practice_type ?? t.profile.notDefined,
        },
        {
          label: t.profile.cabinetName,
          value: professional.cabinet_name ?? t.profile.notDefined,
        },
        {
          label: t.profile.yearsExperience,
          value: professional.years_experience?.toString() ?? t.profile.notDefined,
        },
        {
          label: t.profile.subspecialties,
          value: professional.subspecialties?.join(", ") ?? t.profile.none,
        },
      ],
    },
    {
      section: t.profile.location,
      icon: MapPin,
      items: [
        {
          label: t.profile.address,
          value: professional.address ?? t.profile.notDefinedFeminine,
        },
        { label: t.profile.city, value: professional.city ?? t.profile.notDefinedFeminine },
        {
          label: t.profile.postalCode,
          value: professional.postal_code ?? t.profile.notDefined,
        },
      ],
    },
    {
      section: t.profile.languages,
      icon: Globe,
      items: [
        {
          label: t.profile.spokenLanguages,
          value: professional.languages_spoken?.join(", ") ?? t.profile.notDefined,
        },
      ],
    },
  ];

  const reviewCount = professional.total_reviews ?? 0;

  return (
    <div className="space-y-6">
      {/* Header with avatar */}
      <div className="flex items-center gap-5">
        <Avatar className="size-16">
          <AvatarImage
            src={userProfile.avatar_url ?? undefined}
            alt={userProfile.first_name ?? undefined}
          />
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {userProfile.first_name} {userProfile.last_name}
            </h1>
            <StatusBadge type="verification" value={professional.verification_status ?? "pending"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {translateSpecialty(professional.specialty, locale)}
            {professional.cabinet_name && ` \u2014 ${professional.cabinet_name}`}
          </p>
        </div>
      </div>

      {/* Rating + Bio */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <Star className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {professional.rating?.toFixed(1) ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reviewCount} {reviewCount !== 1 ? t.profile.reviewPlural : t.profile.reviewSingular}
              </p>
            </div>
          </CardContent>
        </Card>

        {professional.bio && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {professional.bio}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent ratings */}
      {recentRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-muted-foreground" />
              {t.profile.recentReviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRatings.map((r, idx) => {
                const patientName = r.patient_first_name
                  ? `${r.patient_first_name} ${r.patient_last_name ?? ""}`.trim()
                  : t.profile.patient;
                const patientInitials = r.patient_first_name
                  ? `${r.patient_first_name[0]}${r.patient_last_name?.[0] ?? ""}`.toUpperCase()
                  : "P";
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
                              <Star
                                key={i}
                                className={`size-3 ${
                                  i < r.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "d MMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        {r.service_name && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.service_name}
                          </p>
                        )}
                        {r.comment && (
                          <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile sections */}
      {fields.map((section) => (
        <Card key={section.section}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <section.icon className="size-4 text-muted-foreground" />
              {section.section}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <div key={item.label}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-right text-sm font-medium">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
