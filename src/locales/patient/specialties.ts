/**
 * Specialty canonical keys.
 *
 * The database stores language-independent keys (e.g. "general_practitioner").
 * This module translates them to the user's locale for display.
 */

// ---------------------------------------------------------------------------
// Canonical specialty keys — these are the ONLY values stored in the DB.
// ---------------------------------------------------------------------------

export const SPECIALTY_KEYS = [
  "general_practitioner",
  "cardiology",
  "dentist",
  "dermatology",
  "gynecology",
  "neurology",
  "ophthalmology",
  "orthopedics",
  "pediatrics",
  "psychiatry",
] as const;

export type SpecialtyKey = (typeof SPECIALTY_KEYS)[number];

// ---------------------------------------------------------------------------
// Translation map — key → { pt, fr, en }
// ---------------------------------------------------------------------------

const specialtyTranslations: Record<
  SpecialtyKey,
  { pt: string; fr: string; en: string }
> = {
  general_practitioner: {
    pt: "Médico Generalista",
    fr: "Médecin Généraliste",
    en: "General Practitioner",
  },
  cardiology: {
    pt: "Cardiologia",
    fr: "Cardiologie",
    en: "Cardiology",
  },
  dentist: {
    pt: "Dentista",
    fr: "Dentiste",
    en: "Dentist",
  },
  dermatology: {
    pt: "Dermatologia",
    fr: "Dermatologie",
    en: "Dermatology",
  },
  gynecology: {
    pt: "Ginecologia",
    fr: "Gynécologie",
    en: "Gynecology",
  },
  neurology: {
    pt: "Neurologia",
    fr: "Neurologie",
    en: "Neurology",
  },
  ophthalmology: {
    pt: "Oftalmologia",
    fr: "Ophtalmologie",
    en: "Ophthalmology",
  },
  orthopedics: {
    pt: "Ortopedia",
    fr: "Orthopédie",
    en: "Orthopedics",
  },
  pediatrics: {
    pt: "Pediatria",
    fr: "Pédiatrie",
    en: "Pediatrics",
  },
  psychiatry: {
    pt: "Psiquiatria",
    fr: "Psychiatrie",
    en: "Psychiatry",
  },
};

// ---------------------------------------------------------------------------
// Legacy French → canonical key mapping (for DB migration)
// ---------------------------------------------------------------------------

export const LEGACY_FRENCH_TO_KEY: Record<string, SpecialtyKey> = {
  "Médecin Généraliste": "general_practitioner",
  "Cardiologie": "cardiology",
  "Dentiste": "dentist",
  "Dermatologie": "dermatology",
  "Gynécologie": "gynecology",
  "Neurologie": "neurology",
  "Ophtalmologie": "ophthalmology",
  "Orthopédie": "orthopedics",
  "Pédiatrie": "pediatrics",
  "Psychiatrie": "psychiatry",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Translate a specialty key (stored in DB) to the given locale.
 * Falls back to the raw key if no translation exists.
 */
export function translateSpecialty(
  specialty: string | null | undefined,
  locale: string,
): string | null {
  if (!specialty) return null;
  const entry = specialtyTranslations[specialty as SpecialtyKey];
  if (!entry) return specialty; // unknown key — show as-is
  return (entry as Record<string, string>)[locale] ?? entry.pt;
}

/**
 * Return all specialty options as { value, label } for the given locale.
 * Useful for Select dropdowns and filter components.
 */
export function getSpecialtyOptions(locale: string) {
  return SPECIALTY_KEYS.map((key) => ({
    value: key,
    label: translateSpecialty(key, locale) ?? key,
  }));
}
