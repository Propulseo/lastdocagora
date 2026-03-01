import ptProfessional from "@/locales/pt/professional.json";
import frProfessional from "@/locales/fr/professional.json";
import type { SupportedLocale } from "../types";
import { DEFAULT_LOCALE } from "../types";

export type ProfessionalTranslations = typeof ptProfessional;

// Compile-time assertion: FR must satisfy the same shape as PT
const _check: ProfessionalTranslations = frProfessional;
void _check;

const translationMap: Record<SupportedLocale, ProfessionalTranslations> = {
  pt: ptProfessional,
  fr: frProfessional,
};

export function getProfessionalTranslations(
  locale: SupportedLocale,
): ProfessionalTranslations {
  return translationMap[locale] ?? translationMap[DEFAULT_LOCALE];
}
