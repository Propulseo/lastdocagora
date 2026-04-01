import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Contact,
  Globe,
  ShieldCheck,
} from "lucide-react"
import { InfoRow } from "./InfoRow"
import type { PatientTranslations } from "@/locales/patient"

interface PatientData {
  phone: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  languages_spoken: string[] | null
  insurance_provider: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

interface ProfileInfoCardsProps {
  patient: PatientData | null
  email: string
  phone: string
  formattedBirthDate: string
  langLabels: Record<string, string>
  insuranceLabels: Record<string, string>
  t: PatientTranslations["profile"]
}

export function PersonalInfoCard({
  patient,
  email,
  phone,
  formattedBirthDate,
  langLabels,
  insuranceLabels,
  t,
}: ProfileInfoCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-5 text-primary" />
          {t.personalInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow
          icon={<Mail className="size-4" />}
          label={t.email}
          value={email}
        />
        <InfoRow
          icon={<Phone className="size-4" />}
          label={t.phone}
          value={phone}
        />
        <InfoRow
          icon={<CalendarDays className="size-4" />}
          label={t.birthDate}
          value={formattedBirthDate}
        />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">
            <Globe className="size-4" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.languagesSpoken}</p>
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
          label={t.insuranceProvider}
          value={patient?.insurance_provider ? (insuranceLabels[patient.insurance_provider] ?? patient.insurance_provider) : "-"}
        />
      </CardContent>
    </Card>
  )
}

interface AddressCardProps {
  patient: PatientData | null
  t: PatientTranslations["profile"]
}

export function AddressCard({ patient, t }: AddressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          {t.addressSection}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow
          icon={<MapPin className="size-4" />}
          label={t.addressLabel}
          value={patient?.address ?? "-"}
        />
        <InfoRow
          icon={<MapPin className="size-4" />}
          label={t.city}
          value={patient?.city ?? "-"}
        />
        <InfoRow
          icon={<MapPin className="size-4" />}
          label={t.postalCode}
          value={patient?.postal_code ?? "-"}
        />
      </CardContent>
    </Card>
  )
}

interface EmergencyContactCardProps {
  patient: PatientData | null
  t: PatientTranslations["profile"]
}

export function EmergencyContactCard({ patient, t }: EmergencyContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Contact className="size-5 text-primary" />
          {t.emergencyContact}
        </CardTitle>
        <CardDescription>
          {t.emergencyContactDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow
          icon={<User className="size-4" />}
          label={t.name}
          value={patient?.emergency_contact_name ?? "-"}
        />
        <InfoRow
          icon={<Phone className="size-4" />}
          label={t.phone}
          value={patient?.emergency_contact_phone ?? "-"}
        />
        <InfoRow
          icon={<Contact className="size-4" />}
          label={t.relationship}
          value={patient?.emergency_contact_relationship ?? "-"}
        />
      </CardContent>
    </Card>
  )
}
