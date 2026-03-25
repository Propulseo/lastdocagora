import type { PatientTranslations } from "@/locales/patient"

type ProfessionalWithUser = {
  specialty?: string | null
  users?: { first_name?: string | null; last_name?: string | null } | null
} | null

type ProfessionalLabels = PatientTranslations["professional"]

export function getProfessionalName(
  professional: ProfessionalWithUser,
  labels?: ProfessionalLabels
): string {
  const prefix = labels?.namePrefix ?? "Dr."
  const fallback = labels?.fallbackName ?? "Profissional"
  if (!professional?.users) return fallback
  const { first_name, last_name } = professional.users
  return `${prefix} ${first_name ?? ""} ${last_name ?? ""}`.trim()
}

export function getProfessionalSpecialty(
  professional: ProfessionalWithUser,
  labels?: ProfessionalLabels
): string {
  return professional?.specialty ?? labels?.fallbackSpecialty ?? ""
}

export function getProfessionalInitials(
  professional: ProfessionalWithUser,
  labels?: ProfessionalLabels
): string {
  const fallback = labels?.fallbackInitial ?? "P"
  if (!professional?.users) return fallback
  const f = professional.users.first_name?.[0] ?? ""
  const l = professional.users.last_name?.[0] ?? ""
  return `${f}${l}`.toUpperCase() || fallback
}
