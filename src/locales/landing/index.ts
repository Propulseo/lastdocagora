import { ptLanding, type LandingTranslations } from "./pt"
import { frLanding } from "./fr"
import { enLanding } from "./en"

export type Locale = "pt" | "fr" | "en"
export const DEFAULT_LOCALE: Locale = "pt"
export const LOCALE_COOKIE = "docagora_lang"

const translations: Record<Locale, LandingTranslations> = {
  pt: ptLanding,
  fr: frLanding,
  en: enLanding,
}

export function getLandingTranslations(locale: string): LandingTranslations {
  return translations[locale as Locale] ?? translations[DEFAULT_LOCALE]
}

export function isValidLocale(value: string): value is Locale {
  return value === "pt" || value === "fr" || value === "en"
}

export async function getLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  return isValidLocale(value ?? "") ? (value as Locale) : DEFAULT_LOCALE
}

export type { LandingTranslations }
