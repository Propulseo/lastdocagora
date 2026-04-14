import { type Locale } from "date-fns/locale"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Clock, Building2, Globe, Shield } from "lucide-react"
import { translateSpecialty } from "@/locales/patient/specialties"
import { ProLocationMapWrapper } from "./ProLocationMapWrapper"

interface ProfessionalUser { first_name: string; last_name: string; avatar_url: string | null }

interface Service { id: string; name: string; name_pt?: string | null; name_fr?: string | null; name_en?: string | null; description: string | null; duration_minutes: number; price: number; consultation_type: string }

interface ReviewData {
  id: string
  rating: number | null
  comment: string | null
  created_at: string | null
  appointments?: { patients?: { users?: { first_name?: string; last_name?: string } | null } | null } | null
}

interface InsuranceRow { insurance_provider_id: string; insurance_providers: unknown }

interface ProfessionalDetailContentProps {
  prof: {
    specialty: string
    city: string | null
    rating: number | null
    total_reviews: number | null
    bio: string | null
    bio_pt: string | null
    bio_fr: string | null
    bio_en: string | null
    cabinet_name: string | null
    years_experience: number | null
    languages_spoken: string[] | null
    latitude: number | null
    longitude: number | null
    address: string | null
    users: ProfessionalUser
  }
  services: Service[]
  reviews: ReviewData[]
  proInsurances: InsuranceRow[]
  t: {
    professional: { namePrefix: string }
    professionalDetail: {
      reviews: string
      yearsExperience: string
      about: string
      services: string
      min: string
      online: string
      inPerson: string
      reviewsTitle: string
      fallbackReviewer: string
      location: string
    }
    booking: { priceOnRequest: string }
  }
  locale: string
  dateLocale: Locale
}

function resolveServiceName(svc: Service, locale: string): string {
  const key = `name_${locale}` as keyof Service;
  return (svc[key] as string | null | undefined) ?? svc.name_pt ?? svc.name;
}

export function ProfessionalDetailContent({
  prof,
  services,
  reviews: _reviews,
  proInsurances,
  t,
  locale,
  dateLocale: _dateLocale,
}: ProfessionalDetailContentProps) {
  const u = prof.users
  const fullName = `${t.professional.namePrefix} ${u.first_name} ${u.last_name}`
  const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase()

  const consultationTypeLabel = (type: string) => {
    if (type === "online") return t.professionalDetail.online
    return t.professionalDetail.inPerson
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative size-40 shrink-0 overflow-hidden rounded-2xl border-2 border-background shadow-sm md:size-48">
              {u.avatar_url ? (
                <Image
                  src={u.avatar_url}
                  alt={fullName}
                  fill
                  className="object-cover object-[50%_20%]"
                  sizes="(min-width: 768px) 192px, 160px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted">
                  <span className="text-3xl font-semibold text-muted-foreground md:text-4xl">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <h1 className="text-xl font-bold">{fullName}</h1>
                <Badge variant="secondary" className="mt-1">{translateSpecialty(prof.specialty, locale)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {prof.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {prof.rating.toFixed(1)}
                    </span>
                    {prof.total_reviews != null && (
                      <span>({t.professionalDetail.reviews.replace("{count}", String(prof.total_reviews))})</span>
                    )}
                  </span>
                )}
                {prof.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4 text-primary/60" />
                    {prof.city}
                  </span>
                )}
                {prof.years_experience != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-4 text-primary/60" />
                    {t.professionalDetail.yearsExperience.replace("{count}", String(prof.years_experience))}
                  </span>
                )}
                {prof.cabinet_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-4 text-primary/60" />
                    {prof.cabinet_name}
                  </span>
                )}
              </div>
              {prof.languages_spoken && prof.languages_spoken.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Globe className="size-4 text-primary/60" />
                  {prof.languages_spoken.map((lang) => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              )}
              {proInsurances && proInsurances.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Shield className="size-4 text-primary/60" />
                  {proInsurances.map((row) => {
                    const provider = row.insurance_providers as { name: string } | null
                    return (
                      <Badge key={row.insurance_provider_id} variant="outline">
                        {provider?.name ?? row.insurance_provider_id}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {(() => {
        const bioKey = `bio_${locale}` as keyof typeof prof;
        const bio = (prof[bioKey] as string | null) ?? prof.bio_pt ?? prof.bio;
        return bio ? (
          <Card>
            <CardHeader><CardTitle>{t.professionalDetail.about}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Services */}
      {services && services.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t.professionalDetail.services}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{resolveServiceName(svc, locale)}</p>
                    {svc.description && <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>}
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="size-3.5" />{svc.duration_minutes} {t.professionalDetail.min}</span>
                      <Badge variant="outline" className="text-xs">
                        {consultationTypeLabel(svc.consultation_type)}
                      </Badge>
                    </div>
                  </div>
                  <p className="ml-4 shrink-0 text-sm font-semibold">
                    {svc.price > 0 ? `${svc.price} \u20ac` : t.booking.priceOnRequest}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {prof.latitude && prof.longitude && (
        <Card>
          <CardHeader><CardTitle>{t.professionalDetail.location}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-[200px] overflow-hidden rounded-xl border">
              <ProLocationMapWrapper latitude={prof.latitude} longitude={prof.longitude} />
            </div>
            {prof.address && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary/60" />
                {prof.address}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews are now handled by the ProfessionalReviews component */}
    </div>
  )
}
