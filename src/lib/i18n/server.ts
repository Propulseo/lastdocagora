import { cookies } from "next/headers"
import { LOCALE_COOKIE_NAME, DEFAULT_LOCALE, isSupportedLocale } from "./types"
import type { SupportedLocale } from "./types"

/** Read the current locale from the cookie (server-side only). */
export async function getServerLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}
