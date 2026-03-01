"use client";

import type { ProfessionalTranslations } from "./translations";
import type { SupportedLocale } from "../types";
import { useProfessionalI18nContext } from "./ProfessionalI18nProvider";

export function useProfessionalI18n(): {
  t: ProfessionalTranslations;
  locale: SupportedLocale;
} {
  return useProfessionalI18nContext();
}
