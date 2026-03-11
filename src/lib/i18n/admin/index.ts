import ptAdmin from "../../../../locales/pt/admin.json";
import frAdmin from "../../../../locales/fr/admin.json";

// PT is source of truth — derive the canonical type from it
export type AdminTranslations = typeof ptAdmin;

// Compile-time validation: FR must match PT structure exactly.
// If FR is missing a key, TypeScript will error HERE, not at runtime.
const frAdminChecked: AdminTranslations = frAdmin;

export const supportedLocales = ["pt", "fr", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

// Typed keys for nav config — derived from the JSON structure
export type AdminSidebarGroupKey = keyof AdminTranslations["sidebar"]["groups"];
export type AdminSidebarItemKey = keyof AdminTranslations["sidebar"]["items"];

const translations: Record<SupportedLocale, AdminTranslations> = {
  pt: ptAdmin,
  fr: frAdminChecked,
  en: ptAdmin, // fallback to PT until English admin translations are created
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
