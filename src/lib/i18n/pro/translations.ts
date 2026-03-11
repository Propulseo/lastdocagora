import ptProfessional from "@/locales/pt/professional.json";
import frProfessional from "@/locales/fr/professional.json";
import enProfessional from "@/locales/en/professional.json";
import type { SupportedLocale } from "../types";
import { DEFAULT_LOCALE } from "../types";

export type ProfessionalTranslations = typeof ptProfessional;

// Compile-time assertions: FR and EN must satisfy the same shape as PT
const _checkFr: ProfessionalTranslations = frProfessional;
const _checkEn: ProfessionalTranslations = enProfessional;
void _checkFr;
void _checkEn;

const translationMap: Record<SupportedLocale, ProfessionalTranslations> = {
  pt: ptProfessional,
  fr: frProfessional,
  en: enProfessional,
};

export function getProfessionalTranslations(
  locale: SupportedLocale,
): ProfessionalTranslations {
  return translationMap[locale] ?? translationMap[DEFAULT_LOCALE];
}
