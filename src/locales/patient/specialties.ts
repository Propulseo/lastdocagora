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
  "physiotherapy",
  "nutrition",
  "oncology",
  "psychology",
  "internal_medicine",
  "other",
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
  physiotherapy: {
    pt: "Fisioterapia",
    fr: "Physiothérapie",
    en: "Physiotherapy",
  },
  nutrition: {
    pt: "Nutrição",
    fr: "Nutrition",
    en: "Nutrition",
  },
  oncology: {
    pt: "Oncologia",
    fr: "Oncologie",
    en: "Oncology",
  },
  psychology: {
    pt: "Psicologia",
    fr: "Psychologie",
    en: "Psychology",
  },
  internal_medicine: {
    pt: "Medicina Interna",
    fr: "Médecine interne",
    en: "Internal Medicine",
  },
  other: {
    pt: "Outra",
    fr: "Autre",
    en: "Other",
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
  "Physiothérapie": "physiotherapy",
  "Nutrition": "nutrition",
  "Oncologie": "oncology",
  "Psychologie": "psychology",
  "Médecine interne": "internal_medicine",
  "Autre": "other",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Translate a specialty key (stored in DB) to the given locale.
 *
 * Lookup order:
 *  1. Canonical key (e.g. "general_practitioner")
 *  2. Legacy French display value from DB (e.g. "Médecin Généraliste")
 *  3. Reverse-lookup from any locale display value (handles PT/EN values stored in DB)
 *  4. Raw value as fallback
 */
export function translateSpecialty(
  specialty: string | null | undefined,
  locale: string,
): string | null {
  if (!specialty) return null;

  // 1. Canonical key lookup
  const entry = specialtyTranslations[specialty as SpecialtyKey];
  if (entry) return (entry as Record<string, string>)[locale] ?? entry.pt;

  // 2. Legacy French → canonical key
  const legacyKey = LEGACY_FRENCH_TO_KEY[specialty];
  if (legacyKey) {
    const legacyEntry = specialtyTranslations[legacyKey];
    return (legacyEntry as Record<string, string>)[locale] ?? legacyEntry.pt;
  }

  // 3. Reverse-lookup from any locale display value
  for (const [key, translations] of Object.entries(specialtyTranslations)) {
    if (
      translations.pt === specialty ||
      translations.en === specialty ||
      translations.fr === specialty
    ) {
      const found = specialtyTranslations[key as SpecialtyKey];
      return (found as Record<string, string>)[locale] ?? found.pt;
    }
  }

  // 4. Unknown — show as-is
  return specialty;
}

// Private helper — accent-insensitive normalization
function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/**
 * Resolve free-text input to matching canonical specialty keys.
 * Checks canonical key (underscores → spaces) and all locale translations.
 * Accent-insensitive so "medecin generaliste" matches "Médecin Généraliste".
 */
export function resolveSpecialtyKeys(query: string): SpecialtyKey[] {
  const normalized = normalizeText(query)
  if (!normalized) return []

  const matched: SpecialtyKey[] = []
  for (const key of SPECIALTY_KEYS) {
    // Check canonical key (underscores → spaces)
    const keyNorm = key.replace(/_/g, " ")
    if (keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      matched.push(key)
      continue
    }
    // Check all 3 locale translations
    const tr = specialtyTranslations[key]
    for (const label of [tr.pt, tr.fr, tr.en]) {
      const norm = normalizeText(label)
      if (norm.includes(normalized) || normalized.includes(norm)) {
        matched.push(key)
        break
      }
    }
  }
  return matched
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
