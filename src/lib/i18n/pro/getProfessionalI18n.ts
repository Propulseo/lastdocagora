import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, DEFAULT_LOCALE, isSupportedLocale } from "../types";
import type { SupportedLocale } from "../types";
import { getProfessionalTranslations } from "./translations";
import type { ProfessionalTranslations } from "./translations";

export async function getProfessionalI18n(
  userLanguage?: string | null,
): Promise<{ locale: SupportedLocale; t: ProfessionalTranslations }> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  let locale: SupportedLocale = DEFAULT_LOCALE;

  if (isSupportedLocale(cookieValue)) {
    locale = cookieValue;
  } else if (isSupportedLocale(userLanguage)) {
    locale = userLanguage;
  }

  return { locale, t: getProfessionalTranslations(locale) };
}
