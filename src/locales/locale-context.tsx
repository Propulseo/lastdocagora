"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  type PatientTranslations,
  type Locale,
  DEFAULT_LOCALE,
  getPatientTranslations,
  getDateLocale,
} from "./patient"
import { subscribeLocaleChange } from "@/lib/i18n/locale-store"

type LocaleContextValue = {
  locale: Locale
  t: PatientTranslations
  dateLocale: ReturnType<typeof getDateLocale>
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: getPatientTranslations(DEFAULT_LOCALE),
  dateLocale: getDateLocale(DEFAULT_LOCALE),
})

export function PatientLocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    return subscribeLocaleChange((newLocale) => {
      setLocale(newLocale as Locale)
    })
  }, [])

  const t = getPatientTranslations(locale)
  const dateLocale = getDateLocale(locale)

  return (
    <LocaleContext.Provider value={{ locale, t, dateLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function usePatientTranslations() {
  return useContext(LocaleContext)
}
