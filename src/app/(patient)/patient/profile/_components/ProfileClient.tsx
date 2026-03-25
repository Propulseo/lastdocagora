"use client"

import { useState, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Contact,
  Globe,
  Camera,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { usePatientTranslations } from "@/locales/locale-context"
import { PageHeader } from "@/components/shared/page-header"
import { EditProfileForm } from "./edit-profile-form"

type ProfileData = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

type PatientData = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  gender: string | null
  avatar_url: string | null
  languages_spoken: string[] | null
  insurance_provider: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

export function ProfileClient({
  profile,
  patient,
  userId,
  userEmail,
}: {
  profile: ProfileData | null
  patient: PatientData | null
  userId: string
  userEmail: string | undefined
}) {
  const { t, dateLocale } = usePatientTranslations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(
    patient?.avatar_url ?? profile?.avatar_url ?? null
  )
  const [uploading, setUploading] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate format
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(t.profile.invalidFormat)
      return
    }
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.profile.fileTooLarge)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const path = `${userId}/avatar.${ext}`

    // Optimistic update
    const objectUrl = URL.createObjectURL(file)
    setAvatarUrl(objectUrl)

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) {
      // Revert optimistic update
      setAvatarUrl(patient?.avatar_url ?? profile?.avatar_url ?? null)
      toast.error(t.profile.uploadError)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path)

    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    // Update avatar_url in users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)

    if (updateError) {
      toast.error(t.profile.uploadError)
      setUploading(false)
      return
    }

    // Set final URL
    URL.revokeObjectURL(objectUrl)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  const firstName = patient?.first_name ?? profile?.first_name ?? ""
  const lastName = patient?.last_name ?? profile?.last_name ?? ""
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "P"

  const genderLabels: Record<string, string> = {
    male: t.profile.genderMale,
    female: t.profile.genderFemale,
    other: t.profile.genderOther,
  }

  const insuranceLabels: Record<string, string> = {
    none: t.profile.insuranceNone,
    medis: t.profile.insuranceMedis,
    multicare: t.profile.insuranceMulticare,
    advancecare: t.profile.insuranceAdvanceCare,
    fidelidade: t.profile.insuranceFidelidade,
    ageas: t.profile.insuranceAgeas,
    allianz: t.profile.insuranceAllianz,
    other: t.profile.insuranceOther,
  }

  const langLabels: Record<string, string> = {
    fr: t.profile.langFr, en: t.profile.langEn, pt: t.profile.langPt,
    es: t.profile.langEs, de: t.profile.langDe, ar: t.profile.langAr,
    ru: t.profile.langRu, zh: t.profile.langZh, it: t.profile.langIt,
  }

  function formatDate(date: string | null | undefined): string {
    if (!date) return "-"
    try {
      return format(new Date(date), t.profile.dateFormat, {
        locale: dateLocale,
      })
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.profile.title}
        description={t.profile.description}
        action={<EditProfileForm patient={patient} userId={userId} />}
      />

      {/* Profile Header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:items-center sm:text-left">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            className="relative group cursor-pointer rounded-full min-h-[44px] min-w-[44px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={t.profile.changePhoto}
          >
            <Avatar size="lg">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={`${firstName} ${lastName}`}
                />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>
          <div>
            <h2 className="text-xl font-semibold">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {userEmail ?? profile?.email ?? patient?.email}
            </p>
            {patient?.gender && (
              <Badge variant="secondary" className="mt-1">
                {genderLabels[patient.gender] ?? patient.gender}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              {t.profile.personalInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Mail className="size-4" />}
              label={t.profile.email}
              value={userEmail ?? profile?.email ?? patient?.email ?? "-"}
            />
            <InfoRow
              icon={<Phone className="size-4" />}
              label={t.profile.phone}
              value={patient?.phone ?? profile?.phone ?? "-"}
            />
            <InfoRow
              icon={<CalendarDays className="size-4" />}
              label={t.profile.birthDate}
              value={formatDate(patient?.date_of_birth)}
            />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">
                <Globe className="size-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.profile.languagesSpoken}</p>
                {patient?.languages_spoken && patient.languages_spoken.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {patient.languages_spoken.map((code) => (
                      <Badge key={code} variant="secondary" className="text-xs">
                        {langLabels[code] ?? code}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium">-</p>
                )}
              </div>
            </div>
            <InfoRow
              icon={<ShieldCheck className="size-4" />}
              label={t.profile.insuranceProvider}
              value={patient?.insurance_provider ? (insuranceLabels[patient.insurance_provider] ?? patient.insurance_provider) : "-"}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              {t.profile.addressSection}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<MapPin className="size-4" />}
              label={t.profile.addressLabel}
              value={patient?.address ?? "-"}
            />
            <InfoRow
              icon={<MapPin className="size-4" />}
              label={t.profile.city}
              value={patient?.city ?? "-"}
            />
            <InfoRow
              icon={<MapPin className="size-4" />}
              label={t.profile.postalCode}
              value={patient?.postal_code ?? "-"}
            />
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contact className="size-5 text-primary" />
              {t.profile.emergencyContact}
            </CardTitle>
            <CardDescription>
              {t.profile.emergencyContactDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<User className="size-4" />}
              label={t.profile.name}
              value={patient?.emergency_contact_name ?? "-"}
            />
            <InfoRow
              icon={<Phone className="size-4" />}
              label={t.profile.phone}
              value={patient?.emergency_contact_phone ?? "-"}
            />
            <InfoRow
              icon={<Contact className="size-4" />}
              label={t.profile.relationship}
              value={patient?.emergency_contact_relationship ?? "-"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
