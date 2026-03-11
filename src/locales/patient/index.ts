import { pt as ptDateLocale } from "date-fns/locale/pt"
import { fr as frDateLocale } from "date-fns/locale/fr"
import { enUS as enDateLocale } from "date-fns/locale/en-US"
import { ptPatient, type PatientTranslations } from "./pt"
import { frPatient } from "./fr"
import { enPatient } from "./en"

export type Locale = "pt" | "fr" | "en"
export const DEFAULT_LOCALE: Locale = "fr"
export const LOCALE_COOKIE = "docagora_lang"

const translations: Record<Locale, PatientTranslations> = {
  pt: ptPatient,
  fr: frPatient,
  en: enPatient,
}

export function getPatientTranslations(locale: string): PatientTranslations {
  return translations[locale as Locale] ?? translations[DEFAULT_LOCALE]
}

export function isValidLocale(value: string): value is Locale {
  return value === "pt" || value === "fr" || value === "en"
}

// For server components - reads locale from cookies
export async function getLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  return isValidLocale(value ?? "") ? (value as Locale) : DEFAULT_LOCALE
}

// date-fns locale mapping
export type DateFnsLocale = typeof ptDateLocale

const dateFnsLocales: Record<Locale, DateFnsLocale> = {
  pt: ptDateLocale,
  fr: frDateLocale,
  en: enDateLocale,
}

export function getDateLocale(locale: Locale): DateFnsLocale {
  return dateFnsLocales[locale] ?? dateFnsLocales[DEFAULT_LOCALE]
}

export type { PatientTranslations }
