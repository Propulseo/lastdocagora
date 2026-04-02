import { professionalPt } from "@/locales/pt/professional";
import { professionalFr } from "@/locales/fr/professional";
import { professionalEn } from "@/locales/en/professional";
import type { SupportedLocale } from "../types";
import { DEFAULT_LOCALE } from "../types";

export type ProfessionalTranslations = typeof professionalPt;

// Compile-time assertions: FR and EN must satisfy the same shape as PT
const _checkFr: ProfessionalTranslations = professionalFr;
const _checkEn: ProfessionalTranslations = professionalEn;
void _checkFr;
void _checkEn;

const translationMap: Record<SupportedLocale, ProfessionalTranslations> = {
  pt: professionalPt,
  fr: professionalFr,
  en: professionalEn,
};

export function getProfessionalTranslations(
  locale: SupportedLocale,
): ProfessionalTranslations {
  return translationMap[locale] ?? translationMap[DEFAULT_LOCALE];
}
