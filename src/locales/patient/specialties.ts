/**
 * Specialty names are stored in French in the database.
 * This map translates them to other supported locales.
 * The key is the exact French value from the `professionals.specialty` column.
 */

const specialtyTranslations: Record<string, { pt: string; en: string }> = {
  "Cardiologie": { pt: "Cardiologia", en: "Cardiology" },
  "Dentiste": { pt: "Dentista", en: "Dentist" },
  "Dermatologie": { pt: "Dermatologia", en: "Dermatology" },
  "Gynécologie": { pt: "Ginecologia", en: "Gynecology" },
  "Médecin Généraliste": { pt: "Médico Generalista", en: "General Practitioner" },
  "Neurologie": { pt: "Neurologia", en: "Neurology" },
  "Ophtalmologie": { pt: "Oftalmologia", en: "Ophthalmology" },
  "Orthopédie": { pt: "Ortopedia", en: "Orthopedics" },
  "Pédiatrie": { pt: "Pediatria", en: "Pediatrics" },
  "Psychiatrie": { pt: "Psiquiatria", en: "Psychiatry" },
  // Add new specialties here as they appear in the database
}

/**
 * Translate a specialty name (stored in French in the DB) to the given locale.
 * Returns the original value if no translation exists or locale is "fr".
 */
export function translateSpecialty(
  specialty: string | null | undefined,
  locale: string,
): string | null {
  if (!specialty) return null
  if (locale === "fr") return specialty
  const entry = specialtyTranslations[specialty]
  if (!entry) return specialty
  return (entry as Record<string, string>)[locale] ?? specialty
}
