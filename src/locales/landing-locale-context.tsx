"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  type LandingTranslations,
  type Locale,
  DEFAULT_LOCALE,
  getLandingTranslations,
} from "./landing"
import { subscribeLocaleChange } from "@/lib/i18n/locale-store"

type LandingLocaleContextValue = {
  locale: Locale
  t: LandingTranslations
}

const LandingLocaleContext = createContext<LandingLocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: getLandingTranslations(DEFAULT_LOCALE),
})

export function LandingLocaleProvider({
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

  const t = getLandingTranslations(locale)

  return (
    <LandingLocaleContext.Provider value={{ locale, t }}>
      {children}
    </LandingLocaleContext.Provider>
  )
}

export function useLandingTranslations() {
  return useContext(LandingLocaleContext)
}
