"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getAdminTranslations, type AdminTranslations, type SupportedLocale } from ".";
import { subscribeLocaleChange } from "../locale-store";

interface AdminI18nContextValue {
  t: AdminTranslations;
  locale: SupportedLocale;
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

interface AdminI18nProviderProps {
  translations: AdminTranslations;
  locale: SupportedLocale;
  children: ReactNode;
}

export function AdminI18nProvider({
  translations: initialTranslations,
  locale: initialLocale,
  children,
}: AdminI18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const [t, setT] = useState<AdminTranslations>(initialTranslations);

  useEffect(() => {
    return subscribeLocaleChange((newLocale) => {
      setLocale(newLocale);
      setT(getAdminTranslations(newLocale));
    });
  }, []);

  return (
    <AdminI18nContext.Provider value={{ t, locale }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18nContext() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) {
    throw new Error(
      "useAdminI18nContext must be used within AdminI18nProvider",
    );
  }
  return ctx;
}
