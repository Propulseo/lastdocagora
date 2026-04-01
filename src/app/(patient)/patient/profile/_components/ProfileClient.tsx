"use client"

import { usePatientTranslations } from "@/locales/locale-context"
import { format } from "date-fns"
import { PageHeader } from "@/components/shared/page-header"
import { EditProfileForm } from "./edit-profile-form"
import { ProfileHeader } from "./ProfileHeader"
import { PersonalInfoCard, AddressCard, EmergencyContactCard } from "./ProfileInfoCards"

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
  insurance_provider_id: string | null
  insurance_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

interface ProfileClientProps {
  profile: ProfileData | null
  patient: PatientData | null
  userId: string
  userEmail: string | undefined
}

export function ProfileClient({
  profile,
  patient,
  userId,
  userEmail,
}: ProfileClientProps) {
  const { t, dateLocale } = usePatientTranslations()

  const firstName = patient?.first_name ?? profile?.first_name ?? ""
  const lastName = patient?.last_name ?? profile?.last_name ?? ""
  const email = userEmail ?? profile?.email ?? patient?.email ?? "-"
  const phone = patient?.phone ?? profile?.phone ?? "-"

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

      <ProfileHeader
        userId={userId}
        firstName={firstName}
        lastName={lastName}
        email={email}
        gender={patient?.gender ?? null}
        initialAvatarUrl={patient?.avatar_url ?? profile?.avatar_url ?? null}
        genderLabels={genderLabels}
        t={t.profile}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInfoCard
          patient={patient}
          email={email}
          phone={phone}
          formattedBirthDate={formatDate(patient?.date_of_birth)}
          langLabels={langLabels}
          insuranceLabels={insuranceLabels}
          t={t.profile}
        />
        <AddressCard patient={patient} t={t.profile} />
        <EmergencyContactCard patient={patient} t={t.profile} />
      </div>
    </div>
  )
}
