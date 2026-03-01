"use client";

import { useAdminI18nContext } from "./AdminI18nProvider";
import type { AdminTranslations, SupportedLocale } from ".";

/**
 * Client hook for admin translations.
 * Must be used within AdminI18nProvider (placed in admin layout).
 */
export function useAdminI18n(): {
  t: AdminTranslations;
  locale: SupportedLocale;
} {
  return useAdminI18nContext();
}
