"use client"

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
} from "lucide-react"
import { format } from "date-fns"
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

  const firstName = patient?.first_name ?? profile?.first_name ?? ""
  const lastName = patient?.last_name ?? profile?.last_name ?? ""
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "P"

  const genderLabels: Record<string, string> = {
    male: t.profile.genderMale,
    female: t.profile.genderFemale,
    other: t.profile.genderOther,
  }

  function formatDate(date: string | null | undefined): string {
    if (!date) return "-"
    try {
      return format(new Date(date), "d 'de' MMMM 'de' yyyy", {
        locale: dateLocale,
      })
    } catch {
      return date
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.profile.title}
        description={t.profile.description}
        action={<EditProfileForm patient={patient} userId={userId} />}
      />

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar size="lg">
            {(patient?.avatar_url ?? profile?.avatar_url) && (
              <AvatarImage
                src={patient?.avatar_url ?? profile?.avatar_url ?? ""}
                alt={`${firstName} ${lastName}`}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {patient?.email ?? profile?.email ?? userEmail}
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
              value={patient?.email ?? profile?.email ?? "-"}
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
