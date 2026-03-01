import {
  getAdminTranslations,
  isSupportedLocale,
  type AdminTranslations,
  type SupportedLocale,
} from ".";

/**
 * Server-safe function to resolve admin translations.
 * Use in server components, layouts, and server actions.
 *
 * Resolves locale from a raw string (cookie / DB value) with fallback to "pt".
 */
export function getAdminI18n(rawLocale: string | undefined): {
  t: AdminTranslations;
  locale: SupportedLocale;
} {
  const locale: SupportedLocale =
    rawLocale && isSupportedLocale(rawLocale) ? rawLocale : "pt";
  return { t: getAdminTranslations(locale), locale };
}
