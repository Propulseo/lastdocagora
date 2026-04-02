import { adminPt } from "@/locales/pt/admin";
import { adminFr } from "@/locales/fr/admin";
import { adminEn } from "@/locales/en/admin";

// PT is source of truth — derive the canonical type from it
export type AdminTranslations = typeof adminPt;

// Compile-time validation: FR and EN must match PT structure exactly.
// If a locale is missing a key, TypeScript will error HERE, not at runtime.
const frAdminChecked: AdminTranslations = adminFr;
const enAdminChecked: AdminTranslations = adminEn;

export const supportedLocales = ["pt", "fr", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Typed keys for nav config — derived from the JSON structure
export type AdminSidebarGroupKey = keyof AdminTranslations["sidebar"]["groups"];
export type AdminSidebarItemKey = keyof AdminTranslations["sidebar"]["items"];

const translations: Record<SupportedLocale, AdminTranslations> = {
  pt: adminPt,
  fr: frAdminChecked,
  en: enAdminChecked,
};

export function getAdminTranslations(
  locale: SupportedLocale,
): AdminTranslations {
  return translations[locale];
}

export function isSupportedLocale(
  value: unknown,
): value is SupportedLocale {
  return (
    typeof value === "string" &&
    supportedLocales.includes(value as SupportedLocale)
  );
}
