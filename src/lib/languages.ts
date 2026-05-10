/** Supported languages for professional profiles. */
export const LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]["code"]

export const VALID_LANGUAGE_CODES = new Set<string>(
  LANGUAGES.map((l) => l.code),
)

/** Map a stored code to its display label, falling back to the raw code. */
export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

/** Map a stored code to its flag emoji. */
export function languageFlag(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.flag ?? ""
}

/**
 * Normalise legacy free-text values into an array of valid codes.
 *
 * Handles inputs like:
 *   "Português, English"  → ["pt", "en"]
 *   "pt, fr"              → ["pt", "fr"]
 *   "Portuguese"          → ["en"]  (best-effort)
 */
export function parseLegacyLanguages(raw: string): string[] {
  const lookup: Record<string, string> = {
    português: "pt",
    portugues: "pt",
    portuguese: "pt",
    inglês: "en",
    ingles: "en",
    english: "en",
    français: "fr",
    francais: "fr",
    french: "fr",
    español: "es",
    espanol: "es",
    spanish: "es",
    pt: "pt",
    en: "en",
    fr: "fr",
    es: "es",
  }

  const parts = raw.split(/[,;|]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
  const codes = new Set<string>()

  for (const part of parts) {
    const code = lookup[part]
    if (code) codes.add(code)
  }

  return [...codes]
}
