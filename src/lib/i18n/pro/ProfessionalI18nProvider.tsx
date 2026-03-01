"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getProfessionalTranslations, type ProfessionalTranslations } from "./translations";
import type { SupportedLocale } from "../types";
import { subscribeLocaleChange } from "../locale-store";

interface ProfessionalI18nContextValue {
  t: ProfessionalTranslations;
  locale: SupportedLocale;
}

const ProfessionalI18nContext =
  createContext<ProfessionalI18nContextValue | null>(null);

interface ProfessionalI18nProviderProps {
  translations: ProfessionalTranslations;
  locale: SupportedLocale;
  children: ReactNode;
}

export function ProfessionalI18nProvider({
  translations: initialTranslations,
  locale: initialLocale,
  children,
}: ProfessionalI18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const [t, setT] = useState<ProfessionalTranslations>(initialTranslations);

  useEffect(() => {
    return subscribeLocaleChange((newLocale) => {
      setLocale(newLocale);
      setT(getProfessionalTranslations(newLocale));
    });
  }, []);

  return (
    <ProfessionalI18nContext.Provider value={{ t, locale }}>
      {children}
    </ProfessionalI18nContext.Provider>
  );
}

export function useProfessionalI18nContext() {
  const ctx = useContext(ProfessionalI18nContext);
  if (!ctx) {
    throw new Error(
      "useProfessionalI18nContext must be used within ProfessionalI18nProvider",
    );
  }
  return ctx;
}
